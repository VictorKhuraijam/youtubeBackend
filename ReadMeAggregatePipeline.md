# Aggregate Pipeline

The **aggregation pipeline** in MongoDB is a powerful framework ( A framework is a pre-built, reusable structure or environment that provides a foundation for developing software application) &nbsp; used for data aggregation and transformation. It processes data through multiple stages, each performing a specific operation, to return the desired results. It is analogous to chaining multiple data processing steps.

### Components of the Aggregation Pipeline:
An aggregation pipeline consists of multiple `stages`, with each stage transforming the data. The output of one stage serves as the input for the next.

Let’s break down the pipeline step by step:

```js
 User.aggregate([
    {
      $match:{
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      }
    }
  ])
```
<br>

---


## 1. `$match` Stage
```js
{
  $match: {
    username: username?.toLowerCase()
  }
}
```

- **Purpose**: Filters documents to match the given condition.
- **In the Code**:
    - Finds the user whose `username` matches the provided `username` (converted to lowercase).
    - Example: If the input is `"JohnDoe"`, only the user with `username`: `"johndoe"` will be considered for the next stages.

  <br>
---


## 2. `$lookup` **Stage** (First)
<br>

- **Purpose**: Performs a "join-like" operation to combine data from two collections.

```js
{
  $lookup: {
    from: "subcriptions",       // The collection to join with (subscriptions in this case).
    localField: "_id",          // The field in the current collection (User collection) to match.
    foreignField: "channel",    // The field in the "subcriptions" collection to match with.
    as: "subscribers"           // The name of the output array where matched documents will be stored.
  }
}
```

- `from`: Specifies the name of the collection to join with. Here, it’s `"subcriptions"` (the collection that stores subscription relationships).<br>
- `localField`: A field in the current collection (e.g., the `User` collection's `_id` field).<br>
- `foreignField`: A field in the target collection (e.g., the `channel` field in the `subcriptions` collection) that will match `localField`.<br>
- `as`: Defines the name of the new field in the result document, which will be an array containing all matching documents from the `"subcriptions"` collection.
<br><br>
---
<br>

## Example Data

**User Collection (Current Collection)**

|_id	|username	|fullName|
|-----|---------|--------|
|1|	johndoe|	John Doe|
|2	|janedoe	|Jane Doe|

**Subcriptions Collection**

|_id	|subscriber	|channel|
|-----|-----------|-------|
|101|	3|	1|
|102|	4|	1|
|103|	3|  2|

## How It Works
1. MongoDB processes each document in the `User` collection.
2. For each document:
    - It takes the `_id` field (`localField`) of the user.
    - It looks for matching documents in the `subcriptions` collection where the `channel` field (`foreignField`) matches the user's `_id`.
3. If matches are found, they are added as an array under the `subscribers` field (`as`).

## Resulting Output

For the `User` with `_id: 1`:

- localField: _id = 1.
- Matches in subcriptions:
    - `{ _id: 101, subscriber: 3, channel: 1 }`
    - `{ _id: 102, subscriber: 4, channel: 1 }`

The resulting document will be:

```json
{
  "_id": 1,
  "username": "johndoe",
  "fullName": "John Doe",
  "subscribers": [
    { "_id": 101, "subscriber": 3, "channel": 1 },
    { "_id": 102, "subscriber": 4, "channel": 1 }
  ]
}
```

For the `User` with `_id: 2`:

- `localField`:`_id` = 2.
- **Matches** in `subcriptions`:

    - `{ _id: 103, subscriber: 3, channel: 2 }`

The resulting document will be:

```json
{
  "_id": 2,
  "username": "janedoe",
  "fullName": "Jane Doe",
  "subscribers": [
    { "_id": 103, "subscriber": 3, "channel": 2 }
  ]
}
```

## Key Notes
- The result of `$lookup` is an array (`subscribers`) containing all matching documents from the `"subcriptions"` collection.
- If no matches are found, the `subscribers` field will be an empty array (`[]`).
- This operation is equivalent to a "left join" in SQL, meaning all documents from the current collection (`User`) will be included, even if there are no matches in the `"subcriptions"` collection.

<br>
---


## 3. `$lookup` **Stage** (Second)
<br>

```js
{
  $lookup: {
    from: "subcriptions",
    localField: "_id",
    foreignField: "subscriber",
    as: "subscribedTo"
  }
}
```
- **Purpose**: Similar to the first `$lookup`, but for the opposite relationship.
- **In Your Code**:
    - Joins the `subcriptions` collection with the `User` collection.
    - Links User._id with the subscriber field in the subcriptions collection.
    - The resulting array of documents (channels this user subscribes to) is stored in the `subscribedTo` field.
<br>
---

## 4. `$addFields` Stage
<br>

 `$addFields` stage in a MongoDB aggregation pipeline adds or calculates new fields to each document based on the existing data.

```js
{
  $addFields: {
    subscribersCount: {
      $size: "$subscribers"
    },
    channelsSubscribedToCount: {
      $size: "$subscribedTo"
    },
    isSubscribed: {
      $cond: {
        if: { $in: [req.user?._id, "$subscribers.subscriber"]},
        then: true,
        else: false
      }
    }
  }
}
```
## Code Explanation

**Fields Being Added**
1. `subscribersCount`
```js
subscribersCount: {
  $size: "$subscribers"
}
```
- Calculates the number of items in the `$subscribers` array.
- `$subscribers` is added earlier in the pipeline using a `$lookup` operation.
- The `$size` operator returns the size of the array.

2. `channelsSubscribedToCount`
```js
channelsSubscribedToCount: {
  $size: "$subscribedTo"
}
```
- Calculates the number of items in the $subscribedTo array.
- `$subscribedTo` represents the channels this user has subscribed to.

3. `isSubscribed`
```js
isSubscribed: {
  $cond: {
    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
    then: true,
    else: false
  }
}
```

- Checks if the current authenticated user's ID (`req.user?._id`) is present in the `subscriber` field of the `$subscribers` array.
- `$cond` is used to create a conditional statement:
    - If `req.user?._id` exists in the `subscriber` field, `isSubscribed` is set to `true`.
    - Otherwise, `isSubscribed` is set to `false`.
    <br><br>
    ---
    <br>

### Example Data

**Input Document (from a previous `$lookup`)**
```js

{
  "_id": 1,
  "username": "johndoe",
  "subscribers": [
    { "_id": 101, "subscriber": 3, "channel": 1 },
    { "_id": 102, "subscriber": 4, "channel": 1 }
  ],
  "subscribedTo": [
    { "_id": 103, "subscriber": 1, "channel": 5 },
    { "_id": 104, "subscriber": 1, "channel": 6 }
  ]
}
```

**Authenticated User (`req.user?._id`)**
```js
{
  "_id": 3
}
```
<br>

---

## Field Calculations
1. `subscribersCount`

    - `$subscribers` contains 2 documents.
    - `subscribersCount = $size($subscribers) = 2`.

2. `channelsSubscribedToCount`

    - `$subscribedTo` contains 2 documents.
    - `channelsSubscribedToCount = $size($subscribedTo) = 2`.

3. `isSubscribed`

    - Checks if `3` (authenticated user ID) exists in the `subscriber` field of `$subscribers`:

      - `$subscribers.subscriber = [3, 4]`.
      - Since `3` is present, `isSubscribed = true`.
<br><br>
---

## Final Output Document

```js
{
  "_id": 1,
  "username": "johndoe",
  "subscribers": [
    { "_id": 101, "subscriber": 3, "channel": 1 },
    { "_id": 102, "subscriber": 4, "channel": 1 }
  ],
  "subscribedTo": [
    { "_id": 103, "subscriber": 1, "channel": 5 },
    { "_id": 104, "subscriber": 1, "channel": 6 }
  ],
  "subscribersCount": 2,
  "channelsSubscribedToCount": 2,
  "isSubscribed": true
}
```
<br><br>
---
<br>

## Key Notes

1. **Dynamic Fields**: Fields like `subscribersCount` and `channelsSubscribedToCount` are not stored in the database but are dynamically calculated in the pipeline.

2. `isSubscribed` **Check**: The condition verifies whether the authenticated user is subscribed to the channel being queried.

3. **Efficient Aggregation**: This approach ensures that the calculations are done at runtime without modifying the database schema, making the process more flexible and efficient.

<br>

---

## 5. `$project` Stage
<br>

The `$project` stage in MongoDB aggregation pipelines is used to shape the output of documents by including, excluding, or transforming fields. It determines what the final document should look like after processing.

```js
{
  $project: {
    fullName: 1,
    username: 1,
    subscribersCount: 1,
    channelsSubscribedToCount: 1,
    isSubscribed: 1,
    avatar: 1,
    coverImage: 1,
    email: 1,
  }
}
```
**What Happens?**

1. **Field Inclusion** (`fieldName: 1`)

    - When a field is set to `1`, it is **included** in the output.
    - Fields not explicitly mentioned are excluded unless they were added earlier in the pipeline or are part of the default `_id`.

2. **No Transformation**

    - In this case, fields are included as-is; no additional computation is done for the fields in this `$project`.
<br><br>
---
<br>

### Input Document (Before `$project`)

Imagine we have the following document after previous stages in the pipeline (e.g., after `$addFields`):

```js
{
  "_id": 1,
  "fullName": "John Doe",
  "username": "johndoe",
  "subscribersCount": 10,
  "channelsSubscribedToCount": 5,
  "isSubscribed": true,
  "avatar": "link_to_avatar",
  "coverImage": "link_to_cover_image",
  "email": "johndoe@example.com",
  "extraField1": "some data",
  "extraField2": "some other data"
}
```
<br><br>
---
<br>

## Processing with $project

The `$project` stage filters out any fields not explicitly mentioned. Only the following fields are included in the output:

  - `fullName`<br>
  - `username`<br>
  - `subscribersCount`<br>
  - `channelsSubscribedToCount`<br>
  - `isSubscribed`<br>
  - `avatar`<br>
  - `coverImage`<br>
  - `email`<br>
<br>

Fields like `extraField1` and `extraField2` are excluded.

<br><br>
---
<br>

## Output Document (After `$project`)

```json
{
  "fullName": "John Doe",
  "username": "johndoe",
  "subscribersCount": 10,
  "channelsSubscribedToCount": 5,
  "isSubscribed": true,
  "avatar": "link_to_avatar",
  "coverImage": "link_to_cover_image",
  "email": "johndoe@example.com"
}
```

## Key Points

1. **Efficient Data Shaping**

  - $project allows you to only include the fields you need, making the output smaller and more relevant.

2. **No Extra Computation**

  - Unlike `$addFields` or `$set`, `$project` doesn’t calculate or modify field values (in this example). It simply selects fields for inclusion.

3. **Why Use** `$project`?

  - Reduce unnecessary data in the response.
  - Prepare the document for client consumption by including only relevant fields.

4. **Defaults**

  - The `_id` field is included by default unless explicitly excluded (`_id: 0`).
<br><br>
---
<br>

## Customizing `$project`

You can also transform fields in `$project`. For example:

```js
{
  $project: {
    username: { $toUpper: "$username" },
    emailDomain: { $substr: ["$email", {$indexOfBytes: ["$email", "@"]}, -1] }
  }
}
```
This would:

- Convert `username` to uppercase.
- Extract the domain from the `email` field.


<br>
---
<br>

## Final Output

<br>
The pipeline processes the data as follows:

  1. &nbsp;Filters the user document (`$match`).<br>
  2. &nbsp;Adds subscribers and subscriptions through two `$lookup` stages.<br>
  3. &nbsp;Enhances the document with additional calculated fields (`$addFields`).<br>
  4. &nbsp;Limits the output to relevant fields (`$project`).<br>

## Example Workflow:

Suppose the input `username` is `"johnDoe"`. The pipeline:

1. &nbsp;Matches the User document with `username: "johndoe"`.<br>
2. &nbsp;Fetches all subscribers of this user from the subcriptions collection.<br>
3. &nbsp;Fetches all channels this user is subscribed to.<br>
4. &nbsp;Calculates the counts and checks if the authenticated user is a subscriber.<br>
5. &nbsp;Returns a simplified user profile with the necessary fields.<br>
<br>
---

<br>

## Benefits of Aggregation Pipeline:

  1. **Powerful Data Transformation**: Combines and processes data from multiple sources.<br>
  2. **Efficiency**: Executes the query on the database server, reducing application-level processing.<br>
  3. **Flexibility**: Can perform complex queries with filtering, grouping, joining, and transformations in a single pipeline.<br>

The above code efficiently retrieves a user’s profile along with their subscription statistics and subscription status in a single query.

<br>

## Data aggregation

Data aggregation refers to the process of collecting, organizing, and summarizing raw data to transform it into a meaningful and usable format. This can include operations like grouping, filtering, calculating, joining, or summarizing data. The primary goal of data aggregation is to analyze data, gain insights, or create simplified datasets for further processing.

## Key Aspects of Data Aggregation:

1. **Collection**: Gathering raw data from one or more sources (e.g., databases, APIs, or files).<br>
2. **Transformation**: Manipulating the data to fit the desired structure or purpose.<br>
3. **Summarization**: Reducing the dataset to extract relevant information, such as totals, averages, or counts.<br>
4. **Presentation**: Preparing data for visualization or output in a simplified and user-friendly format.

<br><br>
---
<br>

## Example in MongoDB Aggregation Pipeline

In the provided code snippet:
```js
const channel = await User.aggregate([
  {
    $match: {
      username: username?.toLowerCase()
    }
  },
  {
    $lookup: {
      from: "subcriptions",
      localField: "_id",
      foreignField: "channel",
      as: "subscribers"
    }
  },
  {
    $lookup: {
      from: "subcriptions",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribedTo"
    }
  },
  {
    $addFields: {
      subscribersCount: {
        $size: "$subscribers"
      },
      channelsSubscribedToCount: {
        $size: "$subscribedTo"
      },
      isSubscribed: {
        $cond: {
          if: { $in: [req.user?._id, "$subscribers.subscriber"] },
          then: true,
          else: false
        }
      }
    }
  },
  {
    $project: {
      fullName: 1,
      username: 1,
      subscribersCount: 1,
      channelsSubscribedToCount: 1,
      isSubscribed: 1,
      avatar: 1,
      coverImage: 1,
      email: 1,
    }
  }
]);
```

## How Aggregation Works in This Context:

1. **Filter** (`$match`):

    - Selects the specific user whose `username` matches the input.
    - Aggregates data only for that user.

2. **Join** (`$lookup`):

    - Combines data from the `subcriptions` collection to find:
      - Users subscribed to the channel (subscribers).
      - Channels the user is subscribed to (subscribedTo).

3. **Summarize** (`$addFields`):

    - Calculates:
      - Total subscribers (`$size` of `subscribers`).
      - Total channels subscribed to (`$size` of `subscribedTo`).
      - Whether the authenticated user is a subscriber (`$cond` and `$in`).

4. **Filter Output** (`$project`):

      - Includes only the necessary fields (e.g., `username`, `email`, `subscribersCount`) in the final result.
      <br><br>
      ---
      <br>

## Why Data Aggregation Is Useful:

1. **Deriving Insights**: Helps identify trends and patterns, such as user subscription counts in this case.

2. **Efficient Data Processing**: Combines data from multiple collections in a single query rather than making multiple queries.

3. **Simplification**: Produces results that are easier to consume and analyze by transforming raw data into structured and concise outputs.
<br><br>
---
<br>

## Real-World Examples of Data Aggregation:

1. **E-commerce**:

    - Aggregating total sales by region or product category.
    - Finding average customer ratings for a product.

2. **Social Media**:

    - Calculating the number of followers, likes, or shares for a post or user.
    - Identifying mutual connections or shared interests between users.

3. **Finance**:

    - Summarizing daily transactions to calculate total revenue.
    - Grouping expenses by categories (e.g., travel, food, entertainment).
<br><br>

## Sumary

&nbsp;&nbsp;&nbsp;In the specific code,**data aggregation** is used to calculate meaningful statistics about a user's subscriptions (e.g., total subscribers, subscriptions, and whether the current user is subscribed), transforming the raw relationships in the `subcriptions` collection into structured, actionable data.

---
<br><br><br>


## The Final Output

 The final output is **not stored in the database**. It is **computed dynamically** at runtime when the `getUserChannelProfile` endpoint is called.

#### Here’s how it works:

1. **Database Storage**:

    - The database stores only the raw data:
      - The `User` collection stores user profile information like `fullName`, `username`, `avatar`, `email`, etc.
      - The subscriptions collection stores the relationships between subscribers and channels (`subscriber` and `channel` fields).

2. **Dynamic Computation**:

    - The fields like `subscribersCount`, `channelsSubscribedToCount`, and `isSubscribed` are **not stored** in the database.
    - These fields are calculated on-the-fly using the MongoDB `aggregation pipeline`. Specifically:
      - `$lookup` retrieves related subscription data.
      - `$addFields` computes new fields like counts and `isSubscribed`.

3. **In-Memory Result**:

    - The computed data is assembled into the final JSON format and sent as a **response to the client**.
    - It is **not saved back** to the `User` collection or any other database collection.
    <br>
    ---
    <br>

## Why is it not stored?

1. **Dynamic Nature**:

    - The computed fields (`subscribersCount`, etc.) can change frequently as users subscribe/unsubscribe. Storing them would require constant updates, which is inefficient and prone to inconsistency.

2. **Efficiency**:

    - Instead of storing and updating these fields in the database, it’s easier to compute them in real-time when needed.

3. **Purpose**:

    - The purpose of this endpoint is to **retrieve the latest profile and subscription-related information** dynamically, not to modify or persist it in the database.
  <br>
  ---
  <br>

## Summary

- The additional fields (`subscribersCount`, `channelsSubscribedToCount`, `isSubscribed`) are **not stored** in the database.
- They are **computed dynamically** when the `getUserChannelProfile` endpoint is executed.
- The database remains unchanged; the result exists only as an **in-memory object** that is sent as the response to the client.
