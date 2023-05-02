/* globals tableau*/
let data_source;
let selected_worksheet;
let database = "KEBOOLA_68";
let username = "KEBOOLA_WORKSPACE_494363367";
//let password = "C5HPuwoXePNR7vfdxy8s4aMGRnhY9Dn4";
let password = "";
let referencable_cols = [];
let request_body = {};
let selected_marks = {headers:[], data:[]}

function configure(){
  let defaultValues = JSON.stringify({
    database,
    username,
    password
  });
  tableau.extensions.ui
  .displayDialogAsync("./configure_dialog.html", defaultValues, { height: 500, width: 500 })
  .then((closePayload) => {
    newValues = JSON.parse(closePayload);
    database = newValues.database;
    username = newValues.username;
    request_body.username = username;
    password = newValues.password;
    request_body.password = password;
  })
  .catch((error) => {
    // One expected error condition is when the popup is closed by the user (meaning the user
    // clicks the 'X' in the top right of the dialog).  This can be checked for like so:
    switch (error.errorCode) {
      case tableau.ErrorCodes.DialogClosedByUser:
        console.log('Dialog was closed by user');
        break;
      default:
        console.error(error.message);
    }
  });
}

async function cell_change(event) {
  const element = $(event.target);
  let rownum = element.data("rownum");
  let value_conditions = {}
  for (let [colnum, colname] of selected_marks.headers.entries()){
    if (colname == "Measure Values"){
      colname = selected_marks.data[rownum][selected_marks.headers.indexOf("Measure Names")];
    }
    if (referencable_cols.includes(colname)){
      let val = selected_marks.data[rownum][colnum];
      if (val.match(/^\d+,\d+$/)){
        val = val.replace(",", ".");
      }
      value_conditions[colname] = val;
    }
  }
  let new_value = element.val();
  if (new_value.match(/^\d+,\d+$/)){
    new_value = new_value.replace(",", ".");
  }
  let change = {
    conditions: value_conditions,
    column: element.data("column"),
    new_value
  }
  request_body.changes.push(change);
  selected_marks.data[rownum][element.data('colnum')] = element.val();
}

function addSelectionListeners(dashboard){
  for (let worksheet of dashboard.worksheets){
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, async (event)=>{
      makeRequest();
      selected_worksheet = event.sheet;
      let markCollections = await event.sheet.getSelectedMarksAsync();
      console.log(markCollections);
      let markCollection = markCollections.data[0]
      source_id = markCollection.columns[0].fieldId.match(/\[([a-zA-Z0-9.]+)\]/)[1];
      let sources = await selected_worksheet.getDataSourcesAsync();
      data_source = sources.find(s=>s.id=source_id);
      referencable_cols = data_source.fields.filter((field)=>!(field.isCalculatedField || field.isCombinedField || field.isGenerated)).map(field=>field.id)
      let source_table = (await data_source.getLogicalTablesAsync())[0];
      let connection_info = (await data_source.getConnectionSummariesAsync())[0];
      request_body={
        table: source_table.id.split(" (", 1)[0],
        schema: source_table.id.split(" (",2)[1].split(".",1)[0],
        host: connection_info.serverURI,
        database: database,
        username,
        password,
        changes:[]
      }

      selected_marks.headers = [];
      for(col of markCollection.columns){
        selected_marks.headers.push(col.fieldName);
      }
      selected_marks.data = [];
      for (let data_row of markCollection.data){
        let result_row = []
        for (let data_cell of data_row){
          result_row.push(data_cell.formattedValue);
        }
        selected_marks.data.push(result_row);
      }
      show_data_in_table(selected_marks.headers, selected_marks.data);
    
      $("#table-container table input").change(cell_change);
    });
  }
}

function makeRequest(){
  if (request_body && request_body.changes && request_body.changes.length>0){
    $("#message").html("requested data update");
    $.post("./database_handler.php", request_body, (response)=>{
      //console.log("post response:", response);
      //source.refreshAsync();
      $("#message").html(response);
      request_body.changes = [];
    }).fail(()=>{
      $("#message").html("<p>request failed!</p>");
    })
    data_source.refreshAsync();
  }
}

function clear_table(){
  $("table.src-table").remove();
}

function show_data_in_table(headers, data){
  clear_table();
  //console.log("showing in table", headers, data);
  let table_html = "";
  let table_row = "";
  for (let header of headers){
    table_row+="<th>"+header+"</th>";
  }
  table_html+= "<tr>"+table_row+"</tr>";
  for (let row =0; row < data.length; ++row){
    table_row="";
    for (let col = 0; col<data[row].length; ++col){
      let col_identifier = headers[col] == "Measure Values" ? data[row][headers.indexOf("Measure Names")] : headers[col];
      if (referencable_cols.includes(col_identifier)){
        table_row += `<td><input type="text" data-rownum="${row}" data-column="${col_identifier}" data-colnum="${col}" value="${data[row][col]}"></td>`;
      }else{
        table_row += `<td>${data[row][col]}</td>`
      }
    }
    table_html+="<tr>"+table_row+"</tr>";
  }
  $("#table-container").append('<table class="src-table">'+table_html+'</table>');
}

$(document).ready(() => {
  console.log("cookie:", document.cookie);
  //document.cookie="ukladase=true";
  //console.log("new cookie:", document.cookie);
  tableau.extensions.initializeAsync({configure}).then(() => {
    console.log("Initialized!");
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    addSelectionListeners(dashboard);
  });
});
