import AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const handler = async (event, context, callback) => {
   let zip;

   if(event.queryStringParameters && event.queryStringParameters.zip){
      zip = event.queryStringParameters.zip
   }else if(event.pathParameters && event.pathParameters.zip){
      zip = event.pathParameters.zip;
   }
   
   if(zip){
      let zips = zip.split(',');
      let items = [] as any[];

      for(let i = 0; i < Math.min(zips.length, 25); i++){
         let z = zips[i].trim();
         
         if(!z.match(/^[0-9]{5}$/g)){
            continue;
         }

         const result = await getZipCode(z) as any;

         let item = null as any;
         if(result.Items.length > 0){
            item = {
               lat: result.Items[0].LATITUDE,
               lng: result.Items[0].LONGITUDE,
               zip: result.Items[0].ZIPCODE
            }
         }

         if(item){
            items.push(item);
         }
      }


      if(items.length > 0){
         success(callback, items);
      }else{
         fail(callback);
      }

   }else{
      fail(callback);
   }
}

function fail(callback){
   callback(null, {
      statusCode: 404,
      headers: {
         "Access-Control-Allow-Origin": "*", // Required for CORS support to work
         "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS 
         "Cache-Control": "no-cache"
      },
      body: "Not Found"
   });
}

function success(callback, response){
   callback(null, {
      statusCode: 200,
      headers: {
         "Access-Control-Allow-Origin": "*", // Required for CORS support to work
         "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS 
         "Cache-Control": "no-cache"
      },
      body: JSON.stringify(response)
   });
}

function getZipCode(zip){
   const params = {
      TableName: 'zipcodes',
      KeyConditionExpression: '#zip = :zip',
      ExpressionAttributeNames: {
         '#zip': 'ZIPCODE'
      },
      ExpressionAttributeValues: {
         ":zip": zip
      }
   }

   return dynamoDB.query(params).promise();
}