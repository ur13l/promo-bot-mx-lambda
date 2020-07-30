'use strict'
/***
 * delete-hot-promos
 * Lambda function focused on remove past promos from database.
 */

const AWS = require('aws-sdk');

/** How many days will happen to consider an element ready to remove. */
const DAY_THRESHOLD = 5

/** Lambda handler **/
exports.handler = async (event) => {
    const documentClient = new AWS.DynamoDB.DocumentClient();
    const timeLimit = new Date().getTime() - (DAY_THRESHOLD * 24 * 60 * 60 * 1000); // Calculating time limit on seconds
    let statusCode;
    let responseBody;
    console.log(timeLimit);

    try {
        /** Searching for the promos created before the threshold **/
        const params = {
            TableName: 'promo_bot_mx_promos',
            FilterExpression: 'created_at < :limit ',
            ExpressionAttributeValues: { ':limit': timeLimit }
        }

        const items = (await documentClient.scan(params).promise()).Items
        const results = [];
        console.log("items: " + items.length)
        /** Iterating the result to remove the items **/
        items.forEach( item => {
            const paramsDelete = {
                TableName: 'promo_bot_mx_promos',
                Key: {
                    id: item.id
                }
            }
            results.push(documentClient.delete(paramsDelete).promise());
        });

        /** Waiting for the operations to end **/
        await Promise.all(results);
        statusCode = 200;
        responseBody = `Number of promos removed:  ${results.length}`;
    } catch (err) {
        statusCode = 403;
        responseBody = 'Operation error - ' + err; 
    }

    return {
        statusCode: statusCode,
        body: responseBody
    }
}
