#!/bin/bash

# Test API Routes Script
# Make sure the Next.js dev server is running on port 3000

BASE_URL="http://localhost:3000/api/documents"
USER_ID="test-user-123"

echo "🧪 Testing Next.js API Routes for PGLite Backend"
echo "================================================"
echo ""

# Test 1: Create a document
echo "1️⃣ Creating a new document..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"My First Document\", \"userId\": \"$USER_ID\"}")
echo "Response: $CREATE_RESPONSE"
DOC_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
echo "Created document with ID: $DOC_ID"
echo ""

# Test 2: Get document by ID
echo "2️⃣ Getting document by ID..."
curl -s "$BASE_URL/$DOC_ID?userId=$USER_ID" | jq '.'
echo ""

# Test 3: Update document
echo "3️⃣ Updating document..."
curl -s -X PUT "$BASE_URL/$DOC_ID" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"title\": \"Updated Title\", \"content\": \"Some content here\"}" | jq '.'
echo ""

# Test 4: Get sidebar documents
echo "4️⃣ Getting sidebar documents..."
curl -s "$BASE_URL/sidebar?userId=$USER_ID" | jq '.'
echo ""

# Test 5: Get search documents
echo "5️⃣ Getting search documents..."
curl -s "$BASE_URL/search?userId=$USER_ID" | jq '.'
echo ""

# Test 6: Archive document
echo "6️⃣ Archiving document..."
curl -s -X POST "$BASE_URL/$DOC_ID/archive" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}" | jq '.'
echo ""

# Test 7: Get trash documents
echo "7️⃣ Getting trash documents..."
curl -s "$BASE_URL/trash?userId=$USER_ID" | jq '.'
echo ""

# Test 8: Restore document
echo "8️⃣ Restoring document..."
curl -s -X POST "$BASE_URL/$DOC_ID/restore" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}" | jq '.'
echo ""

# Test 9: Delete document
echo "9️⃣ Deleting document..."
curl -s -X DELETE "$BASE_URL/$DOC_ID?userId=$USER_ID" | jq '.'
echo ""

echo "✅ All API route tests completed!"
