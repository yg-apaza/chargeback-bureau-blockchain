'use strict';
const shim = require('fabric-shim');
const util = require('util');

/************************************************************************************************
 * 
 * GENERAL FUNCTIONS 
 * 
 ************************************************************************************************/

/**
 * Returns an object containing information about the caller
 * 
 * @param {*} stub
 */
function getClientIdentity(stub) {
  const ClientIdentity = shim.ClientIdentity;
  let cid = new ClientIdentity(stub);
  let result = {}
  result['getID'] = cid.getID();
  result['getMSPID'] = cid.getMSPID();
  result['getX509Certificate'] = cid.getX509Certificate();
  result['role'] = cid.getAttributeValue("role"); //e.g. acme_operations
  result['affiliation'] = cid.getAttributeValue("hf.Affiliation"); //member name, e.g. ACME
  result['enrollmentID'] = cid.getAttributeValue("hf.EnrollmentID"); //the username, e.g. ngoDonor
  result['fullname'] = cid.getAttributeValue("fullname"); //e.g. Bob B Donor
  return result;
}

/**
 * Executes a query using a specific key
 * 
 * @param {*} key - the key to use in the query
 */
async function queryByKey(stub, key) {
  console.log('============= START : queryByKey ===========');
  console.log('##### queryByKey key: ' + key);

  let resultAsBytes = await stub.getState(key); 
  if (!resultAsBytes || resultAsBytes.toString().length <= 0) {
    throw new Error('##### queryByKey key: ' + key + ' does not exist');
  }
  console.log('##### queryByKey response: ' + resultAsBytes);
  console.log('============= END : queryByKey ===========');
  return resultAsBytes;
}

/**
 * Executes a query based on a provided queryString
 * 
 * @param {*} queryString - the query string to execute
 */
async function queryByString(stub, queryString) {
  console.log('============= START : queryByString ===========');
  console.log("##### queryByString queryString: " + queryString);

  let jsonQueryString = JSON.parse(queryString);

  let iterator = await stub.getStateByRange('', '');

  let allResults = [];
  while (true) {
    let res = await iterator.next();

    if (res.value && res.value.value.toString()) {
      let jsonRes = {};
      console.log('##### queryByString iterator: ' + res.value.value.toString('utf8'));

      jsonRes.Key = res.value.key;
      try {
        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
      } 
      catch (err) {
        console.log('##### queryByString error: ' + err);
        jsonRes.Record = res.value.value.toString('utf8');
      }

      let jsonRecord = jsonQueryString['selector'] || {};

      console.log('##### queryByString jsonRecord - number of JSON keys: ' + Object.keys(jsonRecord).length);
      if (Object.keys(jsonRecord).length == 0) {
        allResults.push(jsonRes);
        continue;
      }

      for (var key in jsonRecord) {
        if (jsonRecord.hasOwnProperty(key)) {
          console.log('##### queryByString jsonRecord key: ' + key + " value: " + jsonRecord[key]);
          console.log('##### queryByString json iterator has key: ' + jsonRes.Record[key]);
          if (!(jsonRes.Record[key] && jsonRes.Record[key] == jsonRecord[key])) {
            continue;
          }
          allResults.push(jsonRes);
        }
      }
    }
    if (res.done) {
      await iterator.close();
      console.log('##### queryByString all results: ' + JSON.stringify(allResults));
      console.log('============= END : queryByString ===========');
      return Buffer.from(JSON.stringify(allResults));
    }
  }
}

/************************************************************************************************
 * 
 * CHAINCODE
 * 
 ************************************************************************************************/

let Chaincode = class {

  /**
   * Initialize the state when the chaincode is either instantiated or upgraded
   * 
   * @param {*} stub 
   */
  async Init(stub) {
    console.log('=========== Init: Instantiated / Upgraded chargebackbureau chaincode ===========');
    return shim.success();
  }

  /**
   * The Invoke method will call the methods below based on the method name passed by the calling
   * program.
   * 
   * @param {*} stub 
   */
  async Invoke(stub) {
    console.log('============= START : Invoke ===========');
    let ret = stub.getFunctionAndParameters();
    console.log('##### Invoke args: ' + JSON.stringify(ret));

    let method = this[ret.fcn];
    if (!method) {
      console.error('##### Invoke - error: no chaincode function with name: ' + ret.fcn + ' found');
      throw new Error('No chaincode function with name: ' + ret.fcn + ' found');
    }
    try {
      let response = await method(stub, ret.params);
      console.log('##### Invoke response payload: ' + response);
      return shim.success(response);
    } catch (err) {
      console.log('##### Invoke - error: ' + err);
      return shim.error(err);
    }
  }

  /**
   * Initialize the state. This should be explicitly called if required.
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async initLedger(stub, args) {
    console.log('============= START : Initialize Ledger ===========');
    console.log('============= END : Initialize Ledger ===========');
  }

  /**
   * Returns caller identity information
   * 
   * @param {*} stub 
   * @return {Buffer}
   */
  async getClientIdentityInfo(stub) {
    const result = getClientIdentity(stub);
    return Buffer.from(JSON.stringify(result));
  }

  /************************************************************************************************
   * 
   * Chargeback functions 
   * 
   ************************************************************************************************/

   /**
   * Creates a new chargeback
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * {
   *    "id":"1234",
   *    "account":"555555******5555",
   *    "amount": 100
   *    "currency": "USD"
   *    "registeredDate":"2018-10-22T11:52:20.182Z"
   * }
   */
  async createChargeback(stub, args) {
    console.log('============= START : createChargeback ===========');
    console.log('##### createChargeback arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = json['id'];

    console.log('##### createChargeback payload: ' + JSON.stringify(json));

    // Check if the chargeback already exists
    let chargebackQuery = await stub.getState(key);
    if (chargebackQuery.toString()) {
      throw new Error('##### createChargeback - This chargeback already exists: ' + json['id']);
    }

    await stub.putState(key, Buffer.from(JSON.stringify(json)));
    console.log('============= END : createChargeback ===========');
  }

  /**
   * Retrieves a specfic chargeback
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryChargeback(stub, args) {
    console.log('============= START : queryChargeback ===========');
    console.log('##### queryChargeback arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = json['id'];
    console.log('##### queryChargeback key: ' + key);

    return queryByKey(stub, key);
  }

  /**
   * Retrieves all chargebacks
   * 
   * @param {*} stub 
   * @param {*} args 
   */
  async queryAllChargebacks(stub, args) {
    console.log('============= START : queryAllChargebacks ===========');
    console.log('##### queryAllChargebacks arguments: ' + JSON.stringify(args));
 
    let queryString = '{}';
    return queryByString(stub, queryString);
  }

  /************************************************************************************************
   * 
   * Blockchain related functions 
   * 
   ************************************************************************************************/

  /**
   * Retrieves the Fabric block and transaction details for a key or an array of keys
   * 
   * @param {*} stub 
   * @param {*} args - JSON as follows:
   * [
   *    {"key": "a207aa1e124cc7cb350e9261018a9bd05fb4e0f7dcac5839bdcd0266af7e531d-1"}
   * ]
   * 
   */
  async queryHistoryForKey(stub, args) {
    console.log('============= START : queryHistoryForKey ===========');
    console.log('##### queryHistoryForKey arguments: ' + JSON.stringify(args));

    // args is passed as a JSON string
    let json = JSON.parse(args);
    let key = json['key'];
    console.log('##### queryHistoryForKey key: ' + key);
    let historyIterator = await stub.getHistoryForKey(key);
    console.log('##### queryHistoryForKey historyIterator: ' + util.inspect(historyIterator));
    let history = [];
    while (true) {
      let historyRecord = await historyIterator.next();
      console.log('##### queryHistoryForKey historyRecord: ' + util.inspect(historyRecord));
      if (historyRecord.value && historyRecord.value.value.toString()) {
        let jsonRes = {};
        console.log('##### queryHistoryForKey historyRecord.value.value: ' + historyRecord.value.value.toString('utf8'));
        jsonRes.TxId = historyRecord.value.tx_id;
        jsonRes.Timestamp = historyRecord.value.timestamp;
        jsonRes.IsDelete = historyRecord.value.is_delete.toString();
      try {
          jsonRes.Record = JSON.parse(historyRecord.value.value.toString('utf8'));
        } catch (err) {
          console.log('##### queryHistoryForKey error: ' + err);
          jsonRes.Record = historyRecord.value.value.toString('utf8');
        }
        console.log('##### queryHistoryForKey json: ' + util.inspect(jsonRes));
        history.push(jsonRes);
      }
      if (historyRecord.done) {
        await historyIterator.close();
        console.log('##### queryHistoryForKey all results: ' + JSON.stringify(history));
        console.log('============= END : queryHistoryForKey ===========');
        return Buffer.from(JSON.stringify(history));
      }
    }
  }
}

shim.start(new Chaincode());
