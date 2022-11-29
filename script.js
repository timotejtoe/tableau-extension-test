/* globals tableau*/
let data_source;

function cell_change(event) {
  const element = event.target;
  const change_name = element.id.replace(/[^-]+-/, "change-");
  if ($(`#changes input.data-change-hidden-input[name="${change_name}"]`).count>0){
    $(`#changes input.data-change-hidden-input[name="${change_name}"]`).val(element.value);
  }else{
    let new_change = `<input type="hidden" class="data-change-hidden-input" name="${change_name}" value="${element.value}">`
    $("#changes").append(new_change);
  }
}

async function initSourceSelect(dashboard) {
  const selectElement = $("#datasource-select");
  let options = {};
  for (let sheet of dashboard.worksheets) {
    let sources = await sheet.getDataSourcesAsync();
    for (let source of sources) {
      if (!(source.id in options)) {
        options[source.id] = source.name;
      }
    }
  }
  let select_inner_html = "";
  for (let source_id in options) {
    select_inner_html += `<option value="${source_id}">${options[source_id]}</option>\n`;
  }
  selectElement.html(select_inner_html);
  initTableSelect(dashboard);
}

async function initTableSelect(dashboard) {
  const data_source_id = $("#datasource-select")[0].value;
  data_source = null;
  for (let sheet of dashboard.worksheets) {
    let sources = await sheet.getDataSourcesAsync();
    for (let source of sources) {
      if (source.id == data_source_id) {
        data_source = source;
        break;
      }
    }
    if (data_source !== null) break;
  }
  let tables = await data_source.getLogicalTablesAsync();
  let select_inner_html = "";
  for (let table of tables) {
    let table_name = table.caption;
    let table_id = table.id;
    select_inner_html += `<option value="${table_id}">${table_name}</option>\n`;
  }
  $("#table-select").html(select_inner_html);
  initColumnSelect();
}

async function initColumnSelect() {
  let table_id = $("#table-select")[0].value;
  let table_data = await data_source.getLogicalTableDataAsync(table_id);
  let select_inner_html = "";
  for (let col=0; col<table_data.columns.length; ++col) {
    select_inner_html += `<li><input type=checkbox id="checkbox-col${col}">${table_data.columns[col].fieldName}</li>`;
  }
  $("#column-select").html(select_inner_html);
}

async function showTable() {
  let table_id = $("#table-select")[0].value;
  let table_data = await data_source.getLogicalTableDataAsync(table_id);
  console.log("table data", table_data);
  let table_inner_html = "";
  let cols_to_view = [];
  for (let col = 0; col < table_data.columns.length; col++) {
    if ($("#checkbox-col" + col)[0].checked) {
      cols_to_view.push(col);
      table_inner_html += "<th>" + table_data.columns[col].fieldName + "</th>";
    }
  }
  table_inner_html = "<tr>" + table_inner_html + "</tr>\n";
  let row_count = table_data.data.length;
  for (let i = 0; i < (row_count < 10 ? row_count : 10); ++i) {
    let row = "";
    for (let j of cols_to_view) {
      row += `<td><input id="td-${
        table_data.data[i][0].value}-${
        table_data.columns[j].fieldName
      }" type="text" value="${table_data.data[i][j].value}"></td>`;
    }
    row = "<tr>" + row + "</tr>\n";
    table_inner_html += row;
  }
  console.log("data_source", data_source);
  let connection_info = (await data_source.getConnectionSummariesAsync())[0];
  console.log("table_id:", table_id);
  console.log("connection info:", connection_info);
  let database_specification;
  let table_name;
  if (connection_info.type == "MySQL"){
    let host = connection_info.serverURI;
    let dbname = data_source.name.match(/\(([^)]+)\)/)[1];
    database_specification = `host=${host};dbname=${dbname}`;
    table_name = table_id.match(/^(\w+)_[A-Z0-9]+/)[1];
  }
  else if (connection_info.type == "Snowflake"){
    let database_name = "KEBOOLA_68";
    let database_schema = table_id.split(" (",2)[1].split(".",1)[0];
    database_specification = `Server=${connection_info.serverURI};Database=${database_name};uid=KEBOOLA_${database_schema};schema=${database_schema}`
    table_name = table_id.split(" (", 1)[0];
  }else{
    console.log("unknown connection type "+connection_info.type);
  }
  console.log("database spec:", database_specification);
  console.log("table_name: ", table_name)
  $("#connection-type-hidden-input").val(connection_info.type);
  $("#db-spec-hidden-input").val(database_specification);
  $("#table-name-hidden-input").val(table_name);

  $("#src-table").html(table_inner_html);
  $("#src-table td").change(cell_change);
}

$(document).ready(() => {
  tableau.extensions.initializeAsync().then(() => {
    console.log("Initialized!");
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    initSourceSelect(dashboard).then(async () => {
      console.log("adding listener for datasource select");
      $("#datasource-select").change(() => {
        console.log("datasource select changed");
        initTableSelect(dashboard);
      });
      $("#table-select").change(() => {
        console.log("table select changed");
        initColumnSelect();
      });
    });
    $("#view-table-button").click(() => {
      showTable();
    });
    $('form').submit((e)=>{
      e.preventDefault();
      console.log("posting");
      let body=$("#changes").serialize();
      console.log("changes: ",body);
      $.post("./database_handler.php", body, function(response){
        //console.log("post response:", response);
        console.log("posted");
        data_source.refreshAsync();
        $("#message").html(response);
        $("#changes input.data-change-hidden-input").remove();
        showTable();
      });
      $("#message").html("updating database...")
    });
  });
});
