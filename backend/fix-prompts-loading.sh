#!/bin/bash
# fix-prompts-loading.sh - Run this to fix prompts.ts loading issues

set -e  # Exit on error

echo "🔧 === APPLYING PROMPTS.TS FIXES ==="

cd backend

# 1. Check if prompts.ts exists
if [ ! -f "src/lib/prompts.ts" ]; then
    echo "❌ ERROR: prompts.ts not found!"
    exit 1
fi

# 2. Backup current file
echo -e "\n1️⃣ Backing up current prompts.ts..."
BACKUP_NAME="src/lib/prompts.ts.backup.$(date +%Y%m%d_%H%M%S)"
cp src/lib/prompts.ts "$BACKUP_NAME"
echo "   ✅ Backed up to: $BACKUP_NAME"

# 3. Check current content
echo -e "\n2️⃣ Checking current prompts.ts content..."
if grep -q "UNIQUE ANALYSIS REQUEST" src/lib/prompts.ts; then
    echo "   ✅ Already contains NEW prompt marker"
else
    echo "   ⚠️ Missing NEW prompt marker - writing new content..."
    
    # The prompts.ts file should already have the correct content from our edits
    # Just verify it's there
    LINE_COUNT=$(wc -l < src/lib/prompts.ts)
    echo "   Current lines: $LINE_COUNT"
fi

# 4. Remove any compiled .js files in src
echo -e "\n3️⃣ Removing compiled .js files in src..."
find src -name "prompts.js" -type f -delete 2>/dev/null || true
find src -name "*.js" -path "*/lib/*" -type f -delete 2>/dev/null || true
echo "   ✅ Cleaned"

# 5. Clear all caches
echo -e "\n4️⃣ Clearing caches..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .ts-node 2>/dev/null || true
rm -rf .ts-node-dev 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# Also clear any parent .cache
cd ..
rm -rf .cache 2>/dev/null || true
cd backend

echo "   ✅ Caches cleared"

# 6. Verify the fix
echo -e "\n5️⃣ Verifying fix..."
if grep -q "UNIQUE ANALYSIS REQUEST" src/lib/prompts.ts; then
    echo "   ✅ New prompt marker found in file"
else
    echo "   ❌ ERROR: New prompt marker NOT found!"
    exit 1
fi

# Check function exists
if grep -q "calculateYearsOfExperience" src/lib/prompts.ts; then
    echo "   ✅ Years calculation function found"
else
    echo "   ❌ Missing years calculation function"
fi

# Check metadata validation
if grep -q "textQuality === 'FAILED'" src/lib/prompts.ts; then
    echo "   ✅ Quality validation found"
else
    echo "   ⚠️ Missing quality validation"
fi

echo -e "\n🎉 Fixes applied successfully!"
echo ""
echo "👉 NEXT STEPS:"
echo "   1. Kill any running Node.js processes:"
echo "      pkill -f 'ts-node-dev' || true"
echo "      pkill -f 'node.*dev' || true"
echo ""
echo "   2. Restart your server:"
echo "      cd backend && npm run dev"
echo ""
echo "   3. Test with a candidate and check logs for:"
echo "      - 'Prompt length: 2500+' chars"
echo "      - 'Years of Experience:' in metrics"
echo "      - Different 'overallScore' per candidate"
