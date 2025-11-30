# Environment Variable Check

## Issue: API calls going to wrong URL

If you see errors like:
- `GET http://localhost:5000/dashboard/employee 404`
- Instead of: `GET http://localhost:5000/api/dashboard/employee`

## Solution

1. **Create `.env` file in `frontend` folder** (if it doesn't exist)

2. **Add this line:**
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Restart the frontend server:**
   - Stop the server (Ctrl+C)
   - Run `npm start` again

## Verify

After restarting, check the browser console. You should see:
- `API Request: GET http://localhost:5000/api/dashboard/employee`

Instead of:
- `API Request: GET http://localhost:5000/dashboard/employee`

## Note

React requires environment variables to start with `REACT_APP_` and you must restart the dev server after changing them.

