<!--&nbsp; - non-breaking space    -->

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
<br><br><br><br>


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
<br><br><br><br><br>


# Access Token and Refresh Token


Access tokens and refresh tokens are commonly used in authentication systems, especially in token-based systems like OAuth. Below is a detailed explanation of access tokens and refresh tokens, using the provided examples for clarity.

## 1. Access Token
### What Is an Access Token?
- An access token is a short-lived credential that is issued to a user upon successful authentication.
- It contains information (called claims) about the user and their permissions (e.g., user_id, email).
- The token is sent with every request to access protected resources (like APIs).

**Code Explanation**: `generateAccesstoken`

```js
userSchema.methods.generateAccessToken = function () {
  try {
    const payload = {
      _id: this._id,  // User's unique ID
      email: this.email,  // User's email
      username: this.username,  // Username
      fullName: this.fullName,  // Full name
    };

    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",  // Expiry time, default to 15 minutes
    });

    return token; // Return the generated token
  } catch (error) {
    console.error("Error generating access token:", error.message);
    throw new Error("Could not generate access token");
  }
};

```

#### Key Points:

1. **Payload:**
   - Contains user-related information (e.g., _id, email).
   - These claims are encoded in the token for quick access without querying the database.

2. **Secret Key:**

   - process.env.ACCESS_TOKEN_SECRET is a private key that ensures the token's authenticity.
   - Without this key, the token cannot be tampered with or forged.

3. **Expiry:**

   - `expiresIn` specifies how long the token is valid.
   - Short-lived tokens (e.g., 15 minutes) reduce the risk of abuse if the token is compromised.

4. **Usage:**

   - Sent in an HTTP header (e.g., `Authorization: Bearer <token>`) with every API request.
   - The server verifies the token before granting access to the requested resource.

#### Why Use Access Tokens?
- **Stateless**: Servers do not need to store user sessions; all required info is in the token.
- **Lightweight**: Easy to use for API authentication.
- **Short-Lived**: Limits exposure to security risks like token theft.

## 2. Refresh Token

### What Is a Refresh Token?

- A refresh token is a long-lived credential used to obtain a new access token when the old one expires.
- It is issued alongside the access token but stored securely (e.g., in an HTTP-only cookie).

**Code Explanation**: `generateRefreshToken`

```js
userSchema.methods.generateRefreshToken = function () {
  try {
    const payload = {
      _id: this._id,  // Only includes user ID to minimize token size
    };

    const token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",  // Expiry time, default to 7 days
    });

    return token; // Return the generated token
  } catch (error) {
    console.error("Error generating refresh token:", error.message);
    throw new Error("Could not generate refresh token");
  }
};
```

#### Key Points:

1. **Payload**:

    - Minimal information (e.g., _id) to reduce token size and limit exposure if compromised.

2. **Secret Key**:

    - process.env.REFRESH_TOKEN_SECRET ensures the token’s authenticity.

3. **Expiry**:

    - Longer-lived than access tokens (e.g., 7 days) to reduce frequent logins.
    - If the refresh token expires, the user must re-authenticate.

4. **Usage**:

    - When an access token expires, the client sends the refresh token to a specific endpoint (e.g., /token/refresh) to get a new access token.
    - This prevents the need for the user to log in again.

### Why Use Refresh Tokens?
- #### Enhanced Security:
  - Access tokens are short-lived, reducing the impact of token theft.
  - Refresh tokens are stored securely and only used when necessary.

- #### Improved User Experience:
  - Users don’t need to log in repeatedly; they get a new access token using the refresh token.
- #### Separation of Concerns:

  - Refresh tokens are used exclusively for re-authentication, not for accessing resources.


## Access Token vs. Refresh Token
|Aspect	   |Access Token |	Refresh Token|
|----------|-------------|---------------|
|**Purpose**	|Used to access protected resources (APIs).	|Used to generate new access tokens.|
|**Lifespan**	|Short-lived (e.g., 15 minutes).|	Long-lived (e.g., 7 days or more).|
|**Payload**|	Contains user information and permissions.|	Minimal info, usually just a user ID.|
|**Usage Frequency**|	Sent with every API request.|	Used only when the access token expires.|
|**Storage Location**|	Kept in memory or short-lived storage.|	Stored securely (e.g., HTTP-only cookies).|
|**Risk**|	Risk of exposure if intercepted.|	Lesser risk, as it’s used infrequently.|
 <br> <br>


### How They Work Together
1. **User Logs In**:

    - Both an access token and a refresh token are issued.

2. **Accessing APIs**:

    - The client sends the access token with each request.
    - The server validates the token and grants access.

3. **Token Expiry**:

    - If the access token expires, the client sends the refresh token to the server to get a new access token.

4. **Logout**:

    - Both tokens are invalidated on the server, ensuring the user is logged out.

By combining access and refresh tokens, you get a balance of **security, scalability, and usability.**

<br><br>


# Access Token and Access Token Secret


The terms **Access Token** and **Access Token Secret** are related to authentication and authorization, but they serve different purposes. Here's a detailed explanation of the differences:

### 1. Access Token
#### What is an Access Token?

- An **Access Token** is a credential issued by an authentication server to represent a user or application after successful authentication.
- It contains information about the user, such as their ID, email, and permissions.
- The token is used to authorize access to protected resources, such as APIs.

#### Key Features:
- **Contains User Information**: Includes claims (e.g., user ID, email, roles).
- **Stateless**: The server doesn’t need to store the token; it can validate it using a signature.
- **Short-Lived**: Typically expires within a short time (e.g., 15 minutes).
- **Format**: Often in JSON Web Token (JWT) format, which has three parts: Header, Payload, and Signature.

### 2. Access Token Secret

#### What is an Access Token Secret?
- The **Access Token Secret** is a private key or secret used to sign or validate the **Access Token**.
- It ensures the authenticity of the token by allowing the server to verify that the token hasn’t been tampered with.
- This secret is never shared with the client; it is stored securely on the server.

#### Key Features:
- **Confidential**: Must remain secure and private on the server.
- **Used for Signing**: Creates the digital signature in the token (if using JWT).
- **Used for Verification**: Ensures the token is valid and has not been altered.


### Differences Between Access Token and Access Token Secret
|Aspect 	     |Access Token	      |Access Token Secret|
|--------------|--------------------|-------------------|
|**Purpose**	|Represents the user's identity and permissions.|	Ensures the token’s authenticity and integrity.|
|**Visibility**|	Sent to the client and included in API requests.|	Never exposed; stored securely on the server.|
|**Function**|	Authorizes access to protected resources.|	Used to sign or verify the access token.|
|**Security**|	Can be short-lived to mitigate risks of exposure.|	Must be securely stored to prevent compromise.|
|**Examples**|	A JWT (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...).	|A secret key like MY_SUPER_SECRET_KEY_123.|
|**Lifespan**|	Expiration is defined in the token itself (e.g., 15 min).	|Does not expire but must remain secure.|

<br>

### How They Work Together
1. **Access Token Generation**:

    - The server creates the token with a payload (user data) and signs it using the **Access Token Secret**.
    - This signature ensures the token’s integrity.

2. **Access Token Validation**:

    - When the client sends the token to the server, the server verifies its signature using the same Access Token Secret.
    - If the signature is valid, the token is trusted, and the user is granted access.

### Analogy

Imagine a **passport**:

- The **Access Token** is like the passport itself, containing details about you (name, nationality, etc.) and allowing you to travel.
- The **Access Token Secret** is like the government’s stamp or seal, which ensures that the passport is genuine and hasn’t been forged.

## Summary
- The **Access Token** is a credential the client uses to access resources.
- The **Access Token Secret** is the server-side key that ensures the token’s authenticity and integrity.

<br><br><br><br><br><br>

# Access Token and Refresh Token Storage

Where access tokens and refresh tokens are stored depends on the application's architecture and security requirements. Here's an overview of common storage options, their advantages, and potential risks:

## 1. Storing Tokens on the Client-Side
### A. Browser (Web Applications)
**1. Local Storage**

- **Where?**: Stored in the browser's `localStorage`.
- **Advantages**:
    - Easy to implement.
    - Persistent storage (tokens remain after the browser is closed).
- **Risks**:
    - Vulnerable to Cross-Site Scripting (XSS) attacks. Malicious scripts can access tokens stored in `localStorage`.
- **Use Case**: Avoid for high-security applications unless XSS mitigation strategies are in place.

**2. Session Storage**

- **Where?**: Stored in the browser's sessionStorage.
- **Advantages**:
    - Data is cleared when the tab or browser is closed, reducing exposure.
    - Safer than localStorage against long-term XSS attacks.
- **Risks**:
    - Still vulnerable to XSS attacks while the browser tab is open.
- **Use Case**: Suitable for short-lived tokens in low-risk scenarios.

**3. Cookies**

- **Where?**: Stored as HTTP-only, secure cookies.
- **Advantages**:
    - Tokens are inaccessible to JavaScript if the `HttpOnly` flag is set.
    - Protected against XSS attacks.
- **Risks**:
    - Vulnerable to **Cross-Site Request Forgery (CSRF)** unless the `SameSite` attribute is set.
- **Use Case**: Preferred for high-security applications. Pair with CSRF protection.

### B. Mobile Applications

**1. Secure Storage Mechanisms:**

- **Android**: Use the **EncryptedSharedPreferences** or **KeyStore**.
- **iOS**: Use the **Keychain**.
- **Advantages**:
    - Highly secure against unauthorized access.
- **Risks**:
    - Minimal, as these mechanisms are hardened against most attacks.
- **Use Case**: Best practice for storing tokens in native mobile apps.

**2. File System**:

- **Where?**: Tokens stored in app-specific directories.
- **Advantages**:
     - Simple to implement.
- **Risks**:
    - Vulnerable to unauthorized access if the device is compromised.
- **Use Case**: Not recommended unless secure mechanisms are unavailable.

## 2. Storing Tokens on the Server-Side

**1. Database**

- **Where?**: Tokens are stored in a database, mapped to the user.
- **Advantages**:
    - Centralized storage for better control (e.g., revoking tokens).
    - No exposure to client-side attacks like XSS or CSRF.
- **Risks**:
    - Increases database load.
- **Use Case**: Common for refresh tokens when implementing token-based authentication.

**2. In-Memory Storage (e.g., Redis)**

- **Where?**: Stored temporarily in an in-memory database.
**Advantages**:
    - High performance for session management.
    - Tokens can expire naturally or be explicitly deleted.
- **Risks**:
    - Requires maintaining a separate server or service.
- **Use Case**: Ideal for highly scalable systems.

**3. Best Practices**

**Access Tokens:**
- Short-lived (e.g., 15 minutes) to minimize risk if stolen.
- Store in memory or cookies with HttpOnly and Secure flags for web apps.

**Refresh Tokens:**
- Longer-lived (e.g., 7 days or more).
- Store in HttpOnly cookies or secure storage mechanisms for mobile apps.
- Use server-side storage for sensitive applications.

### Why Different Storage for Access and Refresh Tokens?

- **Access Tokens:** Typically used frequently for API calls, so they are stored where they can be accessed easily and quickly.

- **Refresh Tokens:** Require higher security as they are used to obtain new access tokens. They are stored more securely, often in cookies or server-side.

## Summary
- **Web Apps:** Use HttpOnly cookies for both tokens where possible.
- **Mobile Apps:** Use native secure storage for both tokens.
- **Server-Side:** Store refresh tokens in a database or Redis for centralized management.


<br><br><br><br>



# Refresh Token Expiry


In most implementations, the **refresh token's expiration** does not automatically extend. Its expiration remains fixed based on when it was issued, regardless of user activity. This means:

1. &nbsp; If the refresh token was issued with a 7-day lifespan and the user is idle for 4 days, they will have 3 days left to use the refresh token when they return.
2. &nbsp; The refresh token's expiration date is absolute and does not "reset" or extend unless explicitly reissued by the server.

<br><br><br>

## How Refresh Token Expiry Works

**1. Token Issuance:**

- When the user logs in, a refresh token is issued with a fixed expiration time (e.g., 7 days).

**2. Using the Refresh Token:**

- Each time the client uses the refresh token to obtain a new access token, the refresh token itself is often not replaced, and its original expiration remains intact.

**3. Expiration:**

- If the refresh token expires before being used, the user will need to reauthenticate (log in again).

### Sliding Expiration (Optional Behavior)

In some systems, refresh token expiration can be extended using a technique called **sliding expiration**. Here's how it works:

- **Each Use Resets Expiry:**

    - If the refresh token is used before it expires (e.g., on day 4), the server may issue a new refresh token with a renewed 7-day lifespan.

- **Advantages:**

    - Keeps users logged in as long as they are active.

- **Disadvantages:**

    - If a token is stolen, it remains valid indefinitely as long as it is actively used, increasing security risks.

### Best Practice

For security, it’s typically recommended to:

1. Keep the refresh token lifespan fixed (e.g., 7 days).<br>
2. Require reauthentication once the refresh token expires.<br>
3. Implement a **revocation mechanism** to handle stolen tokens.<br>
4. Use **sliding expiration** cautiously in environments where user convenience is prioritized over strict security.<br>
