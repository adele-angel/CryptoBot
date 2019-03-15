let coinArr = []; // Contains all coins and their details
let coinToggle = []; // Contains list of coins to present in live reports
// API links
const AllCoins = `https://api.coingecko.com/api/v3/coins/list`;
const singleCoin = `https://api.coingecko.com/api/v3/coins/`;
// CanvasJS ajax request
var updateChart;
// Preloader
let preloader = `<img id="loadAnimation" src="./img/spinner.svg" />`;

$(() => {
    loadMainPage();
});

// Reading coin list from API and updating array and renders coins on screen
let getCoinList = async () => {
    const getCoin = async identifier => await (await fetch(AllCoins)).json();
    try {
        coinArr = [];
        const data = await getCoin();
        let date = new Date();
        for (let i = 0; i < data.length; i++) {
            coinArr.push({
                "id": data[i].id,
                "symbol": data[i].symbol,
                "name": data[i].name,
                "url": singleCoin + data[i].id,
                "stamp": date,
                "press": false,
                "toggle": false
            });
        }

        $("#main").empty();
        coinToggle = [];

        for (let i = 0; i < data.length; i++) {
            $("#main").append(preloader);
            $("#main").append(cardAssemble(i));
        }
        reloadToggleState();
    } catch (exception) {
        // console.error(`Failed to retrieve information =(`);
    }
};

// Ajax call for more info on each coin, writting to LocalStorage and updating values if changed
function getCoinInfo(id, coinIndex) {
    fetch(singleCoin + id)
        .then(coin => {
            return coin.json()
        })
        .then(data => {
            let image = data.image.large;
            let eur = data.market_data.current_price.eur;
            let usd = data.market_data.current_price.usd;
            let ils = data.market_data.current_price.ils;

            coinArr[coinIndex].imageURL = image;
            coinArr[coinIndex].eur = eur;
            coinArr[coinIndex].usd = usd;
            coinArr[coinIndex].ils = ils;
            coinArr[coinIndex].stamp = new Date();
            coinArr[coinIndex].press = true;

            updateLocalStorage(image, eur, usd, ils, coinIndex);
            displayMoreInfo(image, eur, usd, ils, coinArr[coinIndex].symbol);

        }).catch(() => {
            console.error(`Failed to retrieve information`);
        });
    return coinIndex;
}

// Constructing card for html view
function cardAssemble(i) {
    $("#loadAnimation").remove();
    let card = `<div class="coin shadow">
                    <div class="coinTop">
                            <div class="coinID">
                                <div id="_${coinArr[i].id}" class="coinSymbol text-uppercase">${coinArr[i].symbol}
                            </div>
                            <div class="coinName">
                                ${coinArr[i].name}
                            </div>
                            <div class="coinCollapse">
                                <button onclick="renderInfo('${coinArr[i].id}')" type="button" id="btn-${coinArr[i].id}" class="btn btn-info" data-toggle="collapse" data-target="#${coinArr[i].symbol}">
                                    Show Info
                                </button>
                            </div>
                        </div>
                        <div class="coinToggle">
                            <div class="liveReport">Live Report</div>
                            <div class="onoffswitch">
                                <input onclick="toggleButton('${coinArr[i].symbol}')" type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="myonoffswitch${coinArr[i].symbol}">
                                <label class="onoffswitch-label" for="myonoffswitch${coinArr[i].symbol}">
                                    <div class="onoffswitch-inner"></div>
                                    <div class="onoffswitch-switch"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div id="${coinArr[i].symbol}" class="coinBottom collapse">
                        <div class="coinCurr">
                            <div class="eur"></div>
                            <div class="usd"></div>
                            <div class="ils"></div>
                        </div>
                        <div class="coinImage">
                            <img id="pic${coinArr[i].symbol}" class="rounded-circle" src="" />
                        </div>
                    </div>
                </div>`;
    return card;
}

// Reading LocalStorage, time and updating card if 2 seconds has passed
function renderInfo(id) {
    // Checking local storage for requested coin information
    let coinIndex = coinArr.findIndex(obj => obj.id === id);
    let cardStr = window.localStorage.getItem(id);

    if (coinArr[coinIndex].press == false) {
        // Checking request time since last request
        let currentTime = new Date().getTime();
        let deltaTime = (currentTime - coinArr[coinIndex].stamp.getTime()) / 60000;
        // Checking if API call is needed, else using data from local storage
        if (cardStr == null || deltaTime > 2) {
            getCoinInfo(id, coinIndex);
        } else {
            let card = JSON.parse(cardStr);
            displayMoreInfo(card.imageURL, card.eur, card.usd, card.ils, coinArr[coinIndex].symbol);
            updateLocalStorage(card.imageURL, card.eur, card.usd, card.ils, coinIndex);
        }
        coinArr[coinIndex].press == true;
    } else {
        coinArr[coinIndex].press == false;
    }
}

// Insert coin into LocalStorage
function updateLocalStorage(image, eur, usd, ils, coinIndex) {
    let coinDetails = JSON.stringify({
        eur: eur,
        usd: usd,
        ils: ils,
        imageURL: image,
        stamp: new Date()
    });
    localStorage.setItem(coinArr[coinIndex].id, coinDetails);
}

// Renders additional coin info to screen
function displayMoreInfo(image, eur, usd, ils, symbol) {
    $(".coinCurr .eur").html("EUR: " + eur.toFixed(4) + "&euro;");
    $(".coinCurr .usd").html("USD: " + usd.toFixed(4) + "$");
    $(".coinCurr .ils").html("ILS: " + ils.toFixed(4) + "₪");
    $('.coinImage' + ' #pic' + symbol).attr("src", image);
}

// Getting Toggled buttons list
function toggleButton(symbol) {
    let coinIndex = coinArr.findIndex(obj => obj.symbol === symbol);
    if (coinArr[coinIndex].toggle == true) {
        coinArr[coinIndex].toggle = false;
        $('#myonoffswitch' + symbol).prop("checked", false);
        let index = coinToggle.findIndex(obj => obj === symbol);
        coinToggle.splice(index, 1);
    } else {

        if (coinToggle.length < 5) {
            coinArr[coinIndex].toggle = true;
            $('#myonoffswitch' + symbol).prop("checked", true);
            coinToggle.push(symbol);
        } else {
            $('#myonoffswitch' + symbol).prop("checked", false);
            $("#modalForm").empty();
            for (let i = 0; i < 5; i++) {
                let temp = `<div class="form-check" id="option${i}">
                                <label class="form-check-label" for="check${i}">
                                    <input type="checkbox" class="form-check-input" id="check${i}" name="${coinToggle[i]}" value="${coinToggle[i]}" checked>
                                    ${coinToggle[i].toUpperCase()}
                                </label>
                            </div>`;
                $("#modalForm").append(temp);
                $("#myModal").modal();
            }
        }
    }
    let toggleStr = coinToggle.toString();
    localStorage.setItem("toggleState", toggleStr);
}

// Updating selected coins in modal pop-up
function updateToggleList() {
    let unChecked = $("#myModal input:checkbox:not(:checked)");
    if (unChecked.length !== 0) {
        for (let i = 0; i < unChecked.length; i++) {
            let index = coinToggle.findIndex(obj => obj === unChecked[i].value);
            toggleButton(unChecked[i].value);
            $('#option' + index).remove();
        }
    }
}

// Rendering live reports chart
function buildGraph() {
    clearInterval(updateChart);
    var options = {
        title: {
            text: "Crypto Coin Value Vs. Time",
            padding: 10,
            margin: 15,
            backgroundColor: "#F0F8FF",
            borderColor: "lightblue",
            borderThickness: 1,
            cornerRadius: 5
        },
        subtitles: [{
            text: new Date()
        }],
        exportEnabled: true,
        toolTip: {
            shared: true
        },
        legend: {
            cursor: "pointer",
            horizontalAlign: "center",
            verticalAlign: "top"
        },
        axisX: {
            title: "Time [sec]",
            valueFormatString: "ss:ff",
            intervalType: "millisecond",
            interval: 500
        },
        axisY: {
            suffix: " $",
            includeZero: false,
            gridColor: "lightblue",
            interlacedColor: "#F0F8FF",
            scaleBreaks: {
                autoCalculate: true
            }
        }
    }
    options.data = [];
    for (let i = 0; i < coinToggle.length; i++) {
        options.data.push({
            name: coinToggle[i].toUpperCase(),
            type: "line",
            showInLegend: true,
            xValueFormatString: "ss:ff",
            axisYIndex: 1,
            dataPoints: [],
        })
    }
    var chart = new CanvasJS.Chart("chartContainer", options);
    chart.render();
    var str = coinToggle.join(',').toUpperCase();
    var URL = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${str}&tsyms=USD`;
    updateChart = setInterval(function () {
        var date = new Date();
        var dataLength = 5;
        $.get(URL, function (data) {
            for (let i = 0; i < coinToggle.length; i++) {
                options.data[i].dataPoints.push({
                    x: date,
                    y: data[coinToggle[i].toUpperCase()].USD
                });
                if (options.data[i].dataPoints.length > dataLength) {
                    options.data[i].dataPoints.shift();
                }
            }
            var chart = new CanvasJS.Chart("chartContainer", options)
            chart.render();
        });
    }, 2000);
}

function loadMainPage() {
    $("#main").empty();
    $("#main").append(preloader);
    getCoinList();
}

// Preserving the toggle button state
function reloadToggleState() {
    toggleStr = window.localStorage.getItem("toggleState");
    if (toggleStr !== null) {
        coinToggle = toggleStr.split(",");

        for (let i = 0; i < coinToggle.length; i++) {
            let index = coinArr.findIndex(obj => obj.symbol == coinToggle[i]);
            let symbol = coinToggle[i];
            coinArr[index].toggle = true;
            $('#myonoffswitch' + symbol).prop("checked", true);
        }
    }
}

// Navbar -----------------------------------------------------------------------------------------
// Navbar collapse --------------------------------------------------------------------------------
$(".nav-btn-toggle").click(function () {
    const navs = document.querySelectorAll('.navbarItems');
    navs.forEach(nav => nav.classList.toggle('Navbar-ToggleShow'));
});

// Navbar search ----------------------------------------------------------------------------------
$("#searchpic").click(function () {

    let searchArr = ($("#searchinp").val()).split(",");
    $("#searchinp").trigger("blur");

    if ($("#searchinp").val() !== "") {
        $("#home").addClass("active");
        $("#report, #about").removeClass("active");

        clearInterval(updateChart);

        $("#main").empty();
        $("#main").append(preloader);

        let counter = 0;

        for (let i = 0; i < searchArr.length; i++) {
            let coinIndex = coinArr.findIndex(obj => obj.symbol === searchArr[i]);

            if (coinIndex !== -1) {
                $("#main").append(cardAssemble(coinIndex));

                let togIndex = coinToggle.findIndex(obj => obj === searchArr[i]);
                if (togIndex !== -1) {
                    coinArr[togIndex].toggle = true;
                    $('#myonoffswitch' + searchArr[i]).prop("checked", true);
                }
            } else {
                counter++;
                if (counter == searchArr.length) {
                    $("#main").html('<div>Please make sure you typed the coin symbol correctly and try again</div>');
                }
            }
        }
    } else {
        $("#main").html('<div>No results, please enter coin symbol</div>');
    }
});

$("#searchinp").focus(function () {
    $(this).attr("placeholder", "Search");
    $(this).css("text-transform", "uppercase");
});

$("#searchinp").blur(function () {
    if ($("#searchinp").val() == "") {
        $(this).attr("placeholder", "Search");
        $(this).css("text-transform", "capitalize");
    }
});

// Homepage -----------------------------------------------------------------------------------------------------
$("#home, #logopic").click(function () {
    $("#home").addClass("active");
    $("#report, #about").removeClass("active");
    clearInterval(updateChart);
    loadMainPage();
});

// Reports page ------------------------------------------------------------------------------------------------
$("#report").click(function () {
    $("#report").addClass("active");
    $("#home, #about").removeClass("active");
    $("#main").empty();
    $("#main").append(preloader);

    if (coinToggle.length !== 0) {
        $("#main").html('<div id="chartContainer" class="chartContainer" style="height: 300px; width: 100%;"></div>');
        buildGraph();
    } else {
        $("#main").html("Please choose some coins to display");
    }
});

// About page -------------------------------------------------------------------------------------------------
$("#about").click(function () {
    $("#about").addClass("active");
    $("#home, #report").removeClass("active");

    clearInterval(updateChart);
    $("#main").empty();
    $("#main").append(preloader);

    $("#main").load("about.html");
});