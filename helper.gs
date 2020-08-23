function request(url, method, payload){
  
  let header = {
    'Content-Type': 'application/json'
  };
  
  let options = {
    method: method,
    headers: header
  };
  
  if (payload) options['payload'] = JSON.stringify(payload);
  
  let response;
  try {
    response = UrlFetchApp.fetch(url, options);
    let code = response.getResponseCode();
    if (code != 200 && code != 204) throw { error: code };
    console.log(`endpoint: ${url}    http response: ${code}`);
    if(code==204) return null;
    return response.getContentText("UTF-8");
  } catch (error) {
    console.error(error);
  }
}

function getArrayFromSheets(sheetName) {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  let lastrow = ss.getLastRow();
  var values;
  try {
    values = ss.getRange(1, 1, ss.getLastRow(), ss.getLastColumn()).getValues();
  } catch (e) {
    return null;  
  }
  return values;
}

Array.prototype.contains = function (needle) {
   for (i in this) {
       if (this[i] == needle) return true;
   }
   return false;
}