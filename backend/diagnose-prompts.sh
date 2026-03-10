#!/bin/bash
# diagnose-prompts.sh - Run this to identify prompts.ts loading issues

echo "🔍 === PROMPTS.TS DIAGNOSTIC ==="

# 1. Find all prompts.ts files
echo -e "\n1️⃣ All prompts.ts files in project:"
find . -name "prompts.ts" -type f 2>/dev/null

# 2. Check the expected file
EXPECTED_FILE="backend/src/lib/prompts.ts"
if [ -f "$EXPECTED_FILE" ]; then
  echo -e "\n2️⃣ Expected file EXISTS: $EXPECTED_FILE"
  echo "   Last modified: $(stat -c %y "$EXPECTED_FILE" 2>/dev/null || stat -f %Sm "$EXPECTED_FILE" 2>/dev/null)"
  echo "   First 3 lines:"
  head -3 "$EXPECTED_FILE" | sed 's/^/   /'
  
  # Check for new prompt marker
  if grep -q "UNIQUE ANALYSIS REQUEST" "$EXPECTED_FILE"; then
    echo "   ✅ Contains NEW prompt marker"
  else
    echo "   ❌ Missing NEW prompt marker (still has old code)"
  fi
  
  # Count lines
  LINE_COUNT=$(wc -l < "$EXPECTED_FILE")
  echo "   Total lines: $LINE_COUNT"
  
  # Check function length estimate
  echo "   Checking function complexity..."
  if grep -q "yearsOfExperience" "$EXPECTED_FILE" && grep -q "calculateYearsOfExperience" "$EXPECTED_FILE"; then
    echo "   ✅ Contains years calculation"
  else
    echo "   ❌ Missing years calculation"
  fi
else
  echo -e "\n2️⃣ ❌ Expected file NOT FOUND: $EXPECTED_FILE"
fi

# 3. Check import in analyze-candidate.ts
echo -e "\n3️⃣ Import statement in analyze-candidate.ts:"
grep -n "prompts" backend/src/routes/analyze-candidate.ts 2>/dev/null | head -5 || echo "   ❌ No import found"

# 4. Check for compiled .js files that might override .ts
echo -e "\n4️⃣ Compiled prompts.js files (should not exist in src):"
find backend/src -name "prompts.js" -type f 2>/dev/null || echo "   ✅ None found"

# 5. Check for .js files in lib folder
echo -e "\n5️⃣ Any .js files in backend/src/lib:"
find backend/src/lib -name "*.js" -type f 2>/dev/null || echo "   ✅ None found"

# 6. Check ts-node cache
echo -e "\n6️⃣ ts-node cache directories:"
ls -la node_modules/.cache 2>/dev/null | head -5 || echo "   ✅ No cache found"
ls -la .ts-node 2>/dev/null | head -5 || echo "   No .ts-node folder"

# 7. Check package.json for type
echo -e "\n7️⃣ Package.json type:"
grep -E '"type"' backend/package.json 2>/dev/null || echo "   No type field (default is commonjs)"

echo -e "\n🔍 === END DIAGNOSTIC ==="
