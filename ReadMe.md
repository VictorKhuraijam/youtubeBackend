# Aggregation Pipelines in MongoDB


The **Aggregation Pipeline** is a MongoDB feature that processes data in stages, transforming documents from a collection into an aggregated result. It's used for tasks such as filtering, grouping, sorting, and calculating statistics, all in a single query.

### Key Features of Aggregation Pipelines
1. Operates on collections.
2. Processes data in a sequence of stages.
3. Outputs transformed or summarized results.
4. Can include multiple transformations in a single query.
5. Optimized for performance by MongoDB.

### Basic Structure

An aggregation pipeline consists of **stages**, where each stage takes the output of the previous stage as input.

### Syntax

```js
db.collection.aggregate([
  { stage1 },
  { stage2 },
  { stage3 },
  ...
]);
```

Each stage uses an **operator** (e.g., `$match`, `$group`) to process the data.

### Stages and Operators

Here are some commonly used stages and their purposes:<br/><br/>

1. `$match` - **Filters Documents**

Filters documents based on a query (similar to `find()`).

#### Example
```js
db.orders.aggregate([
  { $match: { status: "completed" } }
]);
```

Filters for orders where the `status` is `"completed"`.<br/><br/>

2. `$group` - **Groups Documents**

Groups documents by a specified key and performs aggregations like sum, average, etc.

#### Example
```js
db.orders.aggregate([
  { $group: {
      _id: "$customerId",
      totalAmount: { $sum: "$amount" }
  }}
]);
```

Groups orders by `customerId` and calculates the total amount for each customer.<br/><br/>

3. `$project` - **Reshapes Documents**

Includes, excludes, or modifies fields in the output.

#### Example
```js
db.orders.aggregate([
  { $project: {
      customerId: 1,
      orderDate: 1,
      total: { $multiply: ["$price", "$quantity"] }
  }}
]);
```
Outputs only `customerId`, `orderDate`, and a calculated `total` field.<br/><br/>

4. `$sort` - **Sorts Documents**

Sorts documents by a field in ascending (1) or descending (-1) order.

#### Example
```js
db.orders.aggregate([
  { $sort: { totalAmount: -1 } }
]);
```

Sorts orders by `totalAmount` in descending order.<br/><br/>


5. `$skip` **and** `$limit` - **Pagination**

- `$skip`: &nbsp; Skips a specified number of documents.
- `$limit`: &nbsp; Limits the number of documents in the result.
<!--nbsp - non-breaking space    -->

#### Example
```js
db.orders.aggregate([
  { $sort: { orderDate: -1 } },
  { $skip: 10 },
  { $limit: 5 }
]);
```
Gets the next 5 most recent orders after skipping the first 10.<br/><br/>

6. `$unwind` - **Deconstructs Arrays**

Breaks down arrays into multiple documents, one for each array element.

#### Example
```js
db.orders.aggregate([
  { $unwind: "$items" }
]);
```

If an `order` document contains an `items` array with 3 elements, this stage creates 3 separate documents, one for each item.<br/><br/>


7. `$lookup` - **Joins Collections**

Performs a left outer join with another collection.

#### Example
```js
db.orders.aggregate([
  { $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customerDetails"
  }}
]);
```

Joins the `orders` collection with the `customers` collection, adding customer details to each order.<br/><br/>


8. `$addFields` - **Adds New Fields**

Adds new fields or modifies existing fields in the documents.

#### Example
```js
db.orders.aggregate([
  { $addFields: {
      totalPrice: { $multiply: ["$price", "$quantity"] }
  }}
]);
```

Adds a `totalPrice` field calculated as `price * quantity`.<br/><br/>


9. `$out` - **Writes Results to a Collection**

Writes the aggregation results to a new or existing collection.

#### Example
```js
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $out: "completedOrders" }
]);
```

Writes all completed orders into the `completedOrders` collection.<br/><br/>


10. `$facet` - **Multi-Pipeline Aggregation**

Processes multiple aggregation pipelines in parallel.

#### Example
```js
db.orders.aggregate([
  { $facet: {
      totalSales: [
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ],
      orderCounts: [
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]
  }}
]);
```

Calculates `totalSales` and `orderCounts` in parallel.<br/><br/>


## Advanced Concepts

### Aggregation Expression Operators

- Arithmetic: `$add`, `$subtract`, `$multiply`, `$divide`.
- String: `$concat`, `$toUpper`, `$substr`.
- Array: `$size`, `$push`, `$concatArrays`.
- Conditional: `$cond`, `$ifNull`.

### Pipeline Performance

- Use `$match` early to reduce the number of documents.
- Use indexed fields in `$match` for better performance.
- Avoid `$unwind` unless necessary, as it can create many documents.

#### Explain Plans

To analyze the performance of an aggregation pipeline:
```js
db.orders.explain("executionStats").aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } }
]);
```

### Real-World Example

**Use Case: Get Top 5 Customers by Spending**

```js
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: {
      _id: "$customerId",
      totalSpent: { $sum: "$amount" }
  }},
  { $sort: { totalSpent: -1 } },
  { $limit: 5 }
]);
```

This pipeline:

- Filters for completed orders.
- Groups by customer ID and calculates total spending.
- Sorts customers by total spending in descending order.
- Limits the result to the top 5 customers.

## Summary
- **Aggregation Pipelines** process data in a series of stages.
- They are highly flexible and optimized for performance.
- Useful for filtering, transforming, and summarizing data.
- Advanced operators and expressions allow for complex transformations.
<br><br><br><br><br><br><br>


# For Access and Refresh Token Improvement

## Best Practices

1. **Token Revocation**:
   - Store refresh tokens in the database or cache to allow for revocation.
2. **Environment Variables**:
   - Ensure ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are stored securely and not hardcoded.
3. **Short-Lived Access Tokens**:
   - Keep access tokens short-lived (e.g., 15 minutes) to minimize the risk of misuse.
4. **Regenerate Refresh Tokens**:
   - Issue a new refresh token each time it is used to get a new access token.

This improved implementation ensures clarity, security, and error resilience.
