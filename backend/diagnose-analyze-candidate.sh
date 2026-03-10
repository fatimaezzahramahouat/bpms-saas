#!/bin/bash
# diagnose-analyze-candidate.sh - Find prompt building logic

echo "🔍 === ANALYZE-CANDIDATE.TS DIAGNOSTIC ==="

FILE="backend/src/routes/analyze-candidate.ts"

if [ ! -f "$FILE" ]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

echo -e "\n1️⃣ Import statements for prompts:"
grep -n "prompts" "$FILE" | head -10

echo -e "\n2️⃣ Lines containing 'prompt' variable assignment:"
grep -n -B 2 -A 5 "const prompt\s*=" "$FILE" | head -40

echo -e "\n3️⃣ Check for old French field names (forces/faiblesses):"
if grep -q "forces" "$FILE" || grep -q "faiblesses" "$FILE"; then
    echo "⚠️  Found old French field names - old code still present!"
    grep -n "forces\|faiblesses" "$FILE"
else
    echo "✅ No old French field names found"
fi

echo -e "\n4️⃣ Check if createAnalysisPrompt is called:"
if grep -q "createAnalysisPrompt(" "$FILE"; then
    echo "✅ createAnalysisPrompt() is called"
    grep -n "createAnalysisPrompt(" "$FILE"
else
    echo "❌ createAnalysisPrompt() is NOT called - inline prompt building likely"
fi

echo -e "\n5️⃣ Total lines in file:"
wc -l "$FILE"

echo -e "\n🔍 === END DIAGNOSTIC ==="
