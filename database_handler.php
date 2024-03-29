<?php
function connection_warning_handler($severity, $message, $filename, $lineno){
    if (str_starts_with($message, "odbc_connect(): ")){
        echo "<p>Unable to connect to database:</p>";
        $message = substr($message, 16);
    }else if (str_starts_with($message, "odbc_exec(): ")){
        echo "<p>Unable to update data in database:</p>";
        $message = substr($message, 13);
    }
    echo "<p>".$message."</p>";
    http_response_code(404);
    exit();
}


$odbc_driver = "Driver={SnowflakeDSIIDriver};";
$odbc_driver .= "Server=".$_POST["host"].";Database=".$_POST["database"].";uid=".$_POST["username"].";schema=".$_POST["schema"];
$odbc_driver .= ";pwd=".$_POST["password"];
//echo "<p>$odbc_driver</p>";
set_error_handler("connection_warning_handler");
$connection = odbc_connect($odbc_driver, $_POST["username"], $_POST["password"]);
restore_error_handler();

foreach ($_POST["changes"] as $change){
    $query = "UPDATE \"".$_POST["table"]."\" SET \"".$change["column"]."\"='".$change["new_value"]."'";
    $conds = array_map(function ($col_name, $col_val) {
        return "\"$col_name\" = '$col_val'";
    }, array_keys($change["conditions"]), $change["conditions"]);
    $query .= " WHERE ".implode(" AND ", $conds)."; ";
    echo "<p>".$query."</p>";
    set_error_handler("connection_warning_handler");
    odbc_exec($connection, $query);
    restore_error_handler();
}
echo "<p>Updated data.</p>";