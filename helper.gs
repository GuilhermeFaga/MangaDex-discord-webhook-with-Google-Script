function request(url, method, payload, json = true){
  
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
    if (json) return JSON.parse(fixCharset(response.getContentText("UTF-8")));
    return response.getContentText("UTF-8");
  } catch (error) {
    console.error(error);
  }
}

function getArrayFromSheets(sheetName, columns = 0) {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  let lastrow = ss.getLastRow();
  var values;
  try {
    if (columns == 0) columns = ss.getLastColumn();
    values = ss.getRange(1, 1, ss.getLastRow(), columns).getValues();
  } catch (e) {
    return null;  
  }
  console.log(values);
  return values;
}

Array.prototype.contains = function (needle) {
   for (i in this) {
       if (this[i] == needle) return true;
   }
   return false;
}

function fixCharset(string) {
  //Corrige erros de decodificação de string para ç, ^, `, &, e '

  return string
    .replace(/&#39;/g, "'")
    .replace(/&ccedil;/g, "ç")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&atilde;/g, "ã")
    .replace(/&otilde;/g, "õ")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&acirc;/g, "â")
    .replace(/&ecirc;/g, "ê")
    .replace(/&ocirc;/g, "ô");
}