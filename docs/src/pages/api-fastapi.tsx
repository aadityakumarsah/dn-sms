export function ApiFastapi() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>FastAPI Auth API Reference</h1>
      <p>
        The FastAPI backend runs on port 8000 with full Swagger documentation at <code>/docs</code>.
        All endpoints are versioned under <code>/api/v1/</code>.
      </p>

      <h2>Authentication</h2>

      <h3>Login</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}

Response 200:
{
  "success": true,
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}`}</pre>

      <h3>Refresh Token</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}

Response 200: { "access_token": "...", "refresh_token": "...", ... }`}</pre>

      <h3>Logout</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/v1/auth/logout
Authorization: Bearer <token>

Response 200: { "success": true, "message": "Logged out successfully" }`}</pre>

      <h3>Change Password</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "old_password": "current-password",
  "new_password": "new-password-min-8-chars"
}

Response 200: { "success": true, "message": "Password changed successfully" }`}</pre>

      <h2>User Management</h2>

      <h3>List Users</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/v1/users/
Authorization: Bearer <token>

Query Parameters:
  page       integer  Default: 1
  per_page   integer  Default: 20  Max: 100
  sort_by    string   Default: "created_at"
  sort_order  string   "asc" | "desc"
  search     string   Searches username, email, first_name, last_name
  role_id    integer  Filter by role
  is_active  boolean  Filter by active status

Response 200:
{
  "success": true,
  "data": [{ "id": 1, "email": "...", "username": "...", ... }],
  "total": 50,
  "page": 1,
  "per_page": 20,
  "total_pages": 3,
  "has_next": true,
  "has_prev": false
}`}</pre>

      <h3>Get Current User</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/v1/users/me
Authorization: Bearer <token>

Response 200: { "id": 1, "email": "...", "username": "...", "role_name": "super_admin", ... }`}</pre>

      <h3>Get User by ID</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/v1/users/{user_id}
Authorization: Bearer <token>`}</pre>

      <h3>Create User</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/v1/users/
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "newuser",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "9800000000",
  "role_id": 3,
  "is_active": true
}

Response 201: { "id": 2, "email": "...", ... }`}</pre>

      <h3>Update User</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`PATCH /api/v1/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "updated@example.com",
  "first_name": "Updated",
  "role_id": 4
}

Response 200: { "id": 2, "email": "updated@example.com", ... }`}</pre>

      <h3>Delete User</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`DELETE /api/v1/users/{user_id}
Authorization: Bearer <token>

Response 200: { "success": true, "message": "User deleted successfully" }`}</pre>

      <h2>Role Management</h2>

      <h3>List Roles</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/v1/roles/
Authorization: Bearer <token>
Query: page, per_page, sort_by, sort_order, search

Response 200: { "success": true, "data": [...], "total": 6, ... }`}</pre>

      <h3>Get Role</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/v1/roles/{role_id}
Authorization: Bearer <token>

Response 200:
{
  "id": 1,
  "name": "super_admin",
  "description": "Full system access",
  "permissions": ["users:create", "users:read", "users:update", ...],
  "is_system": true,
  "created_at": "...",
  "updated_at": "..."
}`}</pre>

      <h3>Create Role</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/v1/roles/
Authorization: Bearer <token>

{
  "name": "consultant",
  "description": "External consultant",
  "permissions": ["users:read", "reports:read"]
}

Response 201: { "id": 7, ... }`}</pre>

      <h3>Update Role</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`PATCH /api/v1/roles/{role_id}
Authorization: Bearer <token>

{
  "permissions": ["users:read", "reports:read", "students:read"]
}`}</pre>

      <h3>Delete Role</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`DELETE /api/v1/roles/{role_id}
Authorization: Bearer <token>
Note: System roles cannot be deleted`}</pre>

      <h2>Audit Logs</h2>

      <h3>List Audit Logs</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/v1/audit-logs/
Authorization: Bearer <token>

Query Parameters:
  page, per_page, sort_by, sort_order, search
  action     string  Filter: "login", "user_created", "role_change", etc.
  resource   string  Filter: "user", "role", "auth"
  user_id    integer Filter by actor user ID

Response 200: { "success": true, "data": [...], "total": 100, ... }`}</pre>

      <h2>Error Response Format</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": [
    { "field": "body -> email", "message": "value is not a valid email", "type": "value_error" }
  ]
}`}</pre>

      <h2>Error Codes</h2>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">HTTP Status</th><th className="text-left p-2">Code</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2">400</td><td className="p-2 font-mono">BAD_REQUEST</td><td className="p-2">Invalid request</td></tr>
          <tr className="border-b"><td className="p-2">401</td><td className="p-2 font-mono">UNAUTHORIZED</td><td className="p-2">Missing or invalid token</td></tr>
          <tr className="border-b"><td className="p-2">403</td><td className="p-2 font-mono">FORBIDDEN</td><td className="p-2">Insufficient permissions</td></tr>
          <tr className="border-b"><td className="p-2">404</td><td className="p-2 font-mono">NOT_FOUND</td><td className="p-2">Resource not found</td></tr>
          <tr className="border-b"><td className="p-2">409</td><td className="p-2 font-mono">DUPLICATE_ENTRY</td><td className="p-2">Resource already exists</td></tr>
          <tr className="border-b"><td className="p-2">422</td><td className="p-2 font-mono">VALIDATION_ERROR</td><td className="p-2">Validation failed</td></tr>
          <tr className="border-b"><td className="p-2">429</td><td className="p-2 font-mono">RATE_LIMITED</td><td className="p-2">Rate limit exceeded</td></tr>
        </tbody>
      </table>

      <h2>Permission Strings (RBAC)</h2>
      <p>Permissions follow the pattern <code>&lt;resource&gt;:&lt;action&gt;</code>:</p>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Permission</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">users:create</td><td className="p-2">Create new users</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">users:read</td><td className="p-2">View user details</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">users:update</td><td className="p-2">Update user info</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">users:delete</td><td className="p-2">Delete users</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">roles:*</td><td className="p-2">All role operations</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">audit:read</td><td className="p-2">View audit logs</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">students:*</td><td className="p-2">All student operations</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">attendance:*</td><td className="p-2">All attendance operations</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">examinations:*</td><td className="p-2">All exam operations</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">fees:*</td><td className="p-2">All fee operations</td></tr>
        </tbody>
      </table>
    </div>
  );
}
