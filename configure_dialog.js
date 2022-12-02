$(document).ready(function () {
  tableau.extensions.initializeDialogAsync().then(function (openPayload) {
    let defaultValues = JSON.parse(openPayload);
    for (key in defaultValues){
        $("#"+key+"-input").val(defaultValues[key]);
    }
    $("#settings").submit((event)=>{
        event.preventDefault();
        data = {};
        $(event.target).serializeArray().map(function(x){data[x.name] = x.value;}); 
        tableau.extensions.ui.closeDialog(JSON.stringify(data));
    });
  });
});
