"use strict";
const connection = require("../db-connection");
const { Stock } = require("../models");

const StockModel = require("../models").Stock;
const fetch = require("node-fetch");


//create a new stock record in the database.
//이 코드는 주식정보(코드)가 존재하지 않을 때 해당 정보를 데이터베이스에 올리는데 쓰인다 (단, 그 주식 코드 정보는 공인되고 실제 사용되는 걸 올리는 거지 개발자 임의로 주식코드를 만드는 게 아님)
async function createStock(stock, like, ip) {
  const newStock = new StockModel({
    symbol: stock,
    likes: like ? [ip] : [], 
  });
  const savedNew = await newStock.save();
  return savedNew;
}

//Retrieving stock doc from the database where the symbol field matches the stock parameter
//이 블록은 주식 심볼 (주식코드)가 데이터베이스에 있을 때 그 정보를 가져오는데 쓰인다 
async function findStock(stock) {
  return await StockModel.findOne({ symbol: stock}).exec();
}

//Save Stock 주식 정보를 (데이터베이스에 있었던지 아니면 새로 데이터베이스에 추가한) {}안에 저장하는데 쓰인다
async function saveStock(stock, like, ip){
  let saved = {}; //일단 빈 {}를 만들어 saved라고 이름붙인다. 정보는 여기에 저장되어 출력된다 
  //if the stock information is found: 만일 주식 정보가 데이터베이스에 있으면
  const foundStock = await findStock(stock);
  //if the stock information is not found in the database: 만일 주식 정보가 데이터베이스에 없으면
  if(!foundStock){
    const createsaved = await createStock(stock, like, ip);
    saved = createsaved;
    return saved;
  } 
  //This block is for making sure the user clicks only once on Like button (when the stock info is found in the database) 아래의 코드블록은 사용자가 '좋아요'를 한번만 누르게끔 하는 코드이다 ip와 연동되어 1회보다 많이 누르면 카운트되지 않는다 
  else {
    if (like && foundStock.likes.indexOf(ip) === -1) {
      foundStock.likes.push(ip);
  }
  saved = await foundStock.save();
  return saved;
  }
}

//handling Get Price and Like button
//이 코드블록은 주식 가격을 외부 API에서 가져와 주식 코드와 함께 출력한다  
async function getStock(stock) {
  const response = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`,
  );
  const { symbol, latestPrice } = await response.json(); //json은 {정보1, 정보2}의 키앤 밸류 형식으로 정보를 보여주는 형식이다 
  return { symbol, latestPrice };
}

    //API Route Handler This is the main entry point for handling incoming API requests. It depends on the utility functions defined above.
    //This function exports an API route handler that integrates with the application (app) by defining a GET route at /api/stock-price
    module.exports = function (app) {
      app.route("/api/stock-prices").get(async function (req, res) {
      
        const { stock, like } = req.query;
        const isLiked = like === "true";
      //Ensures the stock parameter is provided. If missing, responds with a 400 Bad Request error.
        if (!stock) {
          res.status(400).json({ error: "Stock query parameter is required" });
          return;
        }

        if (Array.isArray(stock) && stock.length > 2) {
          res.status(400).json({ error: "Provide up to two stocks for comparison" });
          return;
        }
        //If exactly two stocks are provided:
        //Destructures the two stock symbols into firstStock and secondStock.
        if (Array.isArray(stock) && stock.length === 2) {
          const [firstStock, secondStock] = stock;

          let firstStockData, secondStockData;
          try {
            firstStockData = await getStock(firstStock);
          } catch (error) {
            res.status(404).json({ error: `Stock not found: ${firstStock}` });
            return;
          }
          try {
            secondStockData = await getStock(secondStock);
          } catch (error) {
            res.status(404).json({ error: `Stock not found: ${secondStock}` });
            return;
          }

          const firstSavedStock = await saveStock(firstStock, isLiked, req.ip);
          const secondSavedStock = await saveStock(secondStock, isLiked, req.ip);

          const stockData = [
            {
              stock: firstStockData.symbol,
              price: firstStockData.latestPrice,
              rel_likes: firstSavedStock.likes.length - secondSavedStock.likes.length,
            },
            {
              stock: secondStockData.symbol,
              price: secondStockData.latestPrice,
              rel_likes: secondSavedStock.likes.length - firstSavedStock.likes.length,
            },
          ];

          res.json({ stockData });
          return;
        }

        
// Single stock handling
        try {
          const { symbol, latestPrice } = await getStock(stock);

          if (!symbol) {
            res.status(404).json({ error: "Stock not found" });
            return;
          }

          const singleStockData = await saveStock(symbol, isLiked, req.ip);

          res.json({
            stockData: {
              stock: symbol,
              price: latestPrice,
              likes: singleStockData.likes.length,
            },
          });
        } catch (error) {
          res.status(404).json({ error: "Stock not found or invalid input" });
        }
      });
    };

    
