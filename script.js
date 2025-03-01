const searchInput = document.getElementById('search-input');
const tableBody = document.getElementById('table-body');
const API_URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true`;
const searchEndpoint = `https://api.coingecko.com/api/v3/coins/list`;
const proxy = ' https://corsproxy.io/?'
const CHART_API_URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=9&page=1&sparkline=false`;
const chartsGrid = document.querySelector('.charts-grid');
const apiKey = '0a56b0288e8a436c937ef2c4d6e2e627'; 
const apiUrl = `${proxy}https://newsapi.org/v2/everything?q=crypto&from=2025-01-28&sortBy=publishedAt&apiKey=${apiKey}`;
const cryptos = [];

// Fetch trending coins and cryptocurrencies concurrently
async function fetchTrendingCoinsAndCryptos() {
    try {
        const trendingDataPromise = fetchTrendingCoins();
        const cryptoDataPromise = fetchCryptoCurrencies();
        const chartDataPromise = fetchChartData();
        const newsDataPromise = fetchNewsData();

        const [trendingData, cryptoData, chartData, newsData] = await Promise.all([trendingDataPromise, cryptoDataPromise, chartDataPromise, newsDataPromise]);
        console.log(chartData);
        console.log( trendingData);
        console.log( cryptoData);
        console.log(newsData);
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

// Fetch trending coins
async function fetchTrendingCoins() {
    try {
        const trendingResponse = await fetch('https://api.coingecko.com/api/v3/search/trending');
        const trendingData = await trendingResponse.json();
        const top5CoinsIds = trendingData.coins.slice(0, 7).map(coin => coin.item.id).join(",");
        console.log(trendingData)
        // Fetch market data for the top 5 coins
        const marketResponse = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${top5CoinsIds}&sparkline=true`);
        const marketData = await marketResponse.json();
        console.log(marketData)

        updateTrendingTable(marketData);
    } catch (err) {
        console.log(err);
    }
}
function updateTrendingTable(coins) {
    const tableBody = document.getElementById('trending-table-body');
    
    coins.forEach(coin => {
        const currentPrice = coin.current_price ? coin.current_price.toFixed(2) : 'N/A';
        const priceChange1h = coin.market_cap !== undefined ? coin.market_cap : 'N/A';
        const priceChange24h = coin.price_change_percentage_24h !== undefined ? coin.price_change_percentage_24h.toFixed(2) : 'N/A';
        
        const priceChangeClass1h = coin.price_change_percentage_1h_in_currency >= 0 ? "positive" : "negative";
        const priceChangeClass24h = coin.price_change_percentage_24h >= 0 ? "positive" : "negative";

        const coinImage = coin.image ? `<img src="${coin.image}" alt="${coin.name} logo" width="20" height="20" />` : '';

        tableBody.innerHTML += `<tr>
                                <td>${coinImage} ${coin.name}</td>
                                <td>$${currentPrice}</td>
                                <td class="${priceChangeClass1h}">${priceChange1h}%</td>
                                <td class="${priceChangeClass24h}">${priceChange24h}%</td>
                                <td>$${coin.total_volume.toLocaleString()}</td>
                                <td><canvas id="chart-${coin.id}" class="chart" ></canvas></td>
                                </tr>`;
        setTimeout(() => drawSparkline(`chart-${coin.id}`, coin.sparkline_in_7d.price), 100);
    });
}


// Draw sparkline for the last 7-day price trend
function drawSparkline(canvasId, prices) {
    const cleanedPrices = prices.filter(price => price !== undefined && price !== null);
    const isPositiveTrend = cleanedPrices[cleanedPrices.length - 1] <= 0;
    const lineColor = isPositiveTrend ? "#008000" : "#ff0000";  // Green or Red color

    const ctx = document.getElementById(canvasId).getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: cleanedPrices.map((_, index) => index),
            datasets: [{
                label:canvasId,
                data: cleanedPrices,
                borderColor: lineColor,
                backgroundColor: lineColor + "20",  // Set the background to a lighter shade of the same color
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            elements: { point: { radius: 0 } },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

// Fetch cryptocurrencies (market data)
async function fetchCryptoCurrencies() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        tableBody.innerHTML = ""; // Clear previous table rows

        data.forEach(coin => {
            const tableRow = document.createElement('tr');
            cryptos.push(tableRow);
            tableRow.innerHTML = `
                <td><img src="${coin.image}" width="20" height="20"> ${coin.name}</td>
                <td>${coin.symbol}</td>
                <td>$${coin.current_price}</td>
                <td>$${coin.market_cap}</td>
            `;
            tableBody.appendChild(tableRow);
        });
        return data;  // Return data for logging or additional use
    } catch (error) {
        console.log(error);
        return [];
    }
}

//fetch chart data
async function fetchChartData(){

	try{
        const response = await fetch(CHART_API_URL);
        const data = await response.json();
        displayChart(data);
       
			
	}catch(err){
        console.log(err);
	}
}
//displayCharts
 function displayChart(data){
    
    data.forEach(coin =>{
        const chartContainer = document.createElement('div');
        chartContainer.innerHTML = `<h2>${coin.name}</h2>
                                    <canvas id="charts-${coin.id}"></canvas>`;
        chartsGrid.appendChild(chartContainer);
        createChart(`charts-${coin.id}`, coin);
    });
 }
//create Chart
function createChart(canvasId, coin){
    const ctx =document.getElementById(canvasId).getContext("2d");

    new Chart(ctx,{
        type: "bar",
        data:{
            labels:["Price(USD)", "24h Change", "Market Cap", "Market Cap Change(24h)"],
            datasets:[{
                label:coin.name,
                data: [coin.current_price, coin.price_change_24h, coin.market_cap, coin.market_cap_change_24h],
                borderColor: "#FFD700",
                backgroundColor: "rgba(255, 215, 0 , 0.2)",  // Set the background to a lighter shade of the same color
                borderWidth: 1,
                tension: 0.5,
                pointRadius: 0
            }]
        },
        options:{
            responsive:true,
            elements: { point: { radius: 0 } },
            scales: {y:{beginAtZero:true}}
        }
    })
}

//fetch news data
async function fetchNewsData() {
    const response = await fetch(apiUrl);
    const data = await response.json();
  
    const newsContainer = document.getElementById('news-container');
    
    // Limit the articles to the first 8
    const limitedArticles = data.articles.slice(0, 9);
    
    limitedArticles.forEach(article => {
        const newsCard = document.createElement('div');
        newsCard.classList.add('news-card');

        newsCard.innerHTML = `
            <img src="${article.urlToImage}" alt="${article.title}">
            <div class="news-card-body">
                <h3>${article.title}</h3>
                <p>${article.description || 'No description available'}</p>
                <a href="${article.url}" target="_blank">Read more</a>
            </div>
        `;

        newsContainer.appendChild(newsCard);
    });
}

// Search filter function
function filterData(queries) {
    cryptos.forEach(crypto => {
        if (crypto.innerText.toLowerCase().includes(queries.toLowerCase().trim())) {
            crypto.classList.remove('hide');
        } else {
            crypto.classList.add('hide');
        }
    });
}

// Search input event listener
searchInput.addEventListener('input', (e) => filterData(e.target.value));

// Initial fetch on page load
fetchTrendingCoinsAndCryptos();

// Set interval to fetch trending coins and crypto data periodically
setInterval(() => {
    fetchTrendingCoinsAndCryptos();  // Call both functions simultaneously
}, 300000);
