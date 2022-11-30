Test wraiteback funkce v tableau extension

Návod na zprovoznění:
    1) tato musí být uložena na serveru s nainstalovaným php, pro testování je dobrý xampp (https://www.apachefriends.org), potom musí být složka umístěna ve složce htdocs v místě kam je xampp nainstalován. V xamppu musí být spuštěný apache.
    2) v souboru data_source_table.trex je potřeba se ujistit, že adresa v tagu url umístěném v tagu source-location (řádka 10) odpovídá tomu kde je rozšíření sdíleno (v případě xamppu je soubor v umístění xampp/htdocs/*cesta* dostupný na adrese localhost/*cesta*). Při vložení adresy do prohlíže by se mělo objevit několik výběrů a tlačítek.
    3) Aby nebylo heslo k databázi veřejně dostupné v gitu, není v kódu zadané. V souboru database_handler.php je potřeba na řádku 9 spráně nastavit proměnnou $snowflake_password
    4) Pro přístup k snowflaku se používá modul *odbc*, aby fungoval, je nutné:
        a) povolit jeho použití. v souboru php.ini (při použití xamppu v adresáři xampp/php) se musí vyskytovat řádek 'extension=odbc' (obvykle se tam před úpravou nachází řádek ';extension=odbc' kde stačí odmazat středník)
        b) stáhnout a nainstalovat ovladač pro snowflake ze stránky https://developers.snowflake.com/odbc
po těchto krocích by mělo být rozšíření připraveno k použití