
var title = document.getElementById("stitle").textContent;
console.log(title);
browser.runtime.sendMessage({'title': title});

