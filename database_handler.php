<?php
$changes = [];
$database_specification = "";
$table = "";
$conn_type = "";
$mysql_username = "test-user";
$mysql_password = "***";
$snowflake_username = "KEBOOLA_WORKSPACE_494363367";
$snowflake_password = "***";
foreach($_POST as $key=>$value){
    if (str_starts_with($key, "change")){
        $parts = explode("-", $key);
        $category = str_replace("_"," ",$parts[1]);
        $column = $parts[2];
        if (!isset( $changes[$category])){
        $changes[$category]=[];
        }
        $spaced_value=str_replace("_"," ",$value);
        $changes[$category][$column]=$spaced_value;
    }else if ($key=="database-specification"){
        $database_specification = $value;
    }else if ($key == "table-name"){
        $table = $value;
    }else if ($key == "connection-type"){
        $conn_type = $value;
    }
}
echo "Connection type: ".$conn_type;
if ($conn_type == "MySQL"){
    $dbh = new PDO('mysql:'.$database_specification, $mysql_username, $mysql_password);
    foreach($changes as $category=>$row_values){
        $query = "UPDATE `".$table."` SET ";
        $assignments=array_map(fn(string $key, string $value): string=>"`".$key."`='".$value."'", array_keys($row_values), array_values($row_values));
        $query.=implode(", ", $assignments);
        $query .= " WHERE `Category`='".$category."'; ";
        $dbh->query($query);
    }
    echo "<p>Changed ".count($changes)." rows</p>";
}else if ($conn_type == "Snowflake"){
    $odbc_driver = "Driver={SnowflakeDSIIDriver};";
    $odbc_driver .= $database_specification;
    $odbc_driver .= ";pwd=$snowflake_password";
    //$odbc_driver = "Driver=SnowflakeDSIIDriver;".$database_specification;
    echo "<p>$odbc_driver</p>";
    $connection = odbc_connect($odbc_driver, $snowflake_username, $snowflake_password);
    foreach($changes as $category=>$row_values){
        $query = "UPDATE \"".$table."\" SET ";
        $assignments=array_map(fn(string $key, string $value): string=>"\"".$key."\"='".$value."'", array_keys($row_values), array_values($row_values));
        $query.=implode(", ", $assignments);
        $query .= " WHERE \"Category\"='".$category."'; ";
        echo $query;
        odbc_exec($connection, $query);
    }
    echo "<p>Changed ".count($changes)." rows in snowflake</p>";
}else{
    echo "<p>Unknown connection type: '".$conn_type."'.</p>";
}

