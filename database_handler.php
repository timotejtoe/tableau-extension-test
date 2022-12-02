<?php

$odbc_driver = "Driver={SnowflakeDSIIDriver};";
$odbc_driver .= "Server=".$_POST["host"].";Database=".$_POST["database"].";uid=".$_POST["username"].";schema=".$_POST["schema"];
$odbc_driver .= ";pwd=".$_POST["password"];
//echo "<p>$odbc_driver</p>";
$connection = odbc_connect($odbc_driver, $_POST["username"], $_POST["password"]);
$query = "UPDATE \"".$_POST["table"]."\" SET \"".$_POST["column"]."\"='".$_POST["new_value"]."'";
$query .= " WHERE \"Category\"='".$_POST["category"]."'; ";
echo $query;
odbc_exec($connection, $query);
echo "<p>Updated data.</p>";