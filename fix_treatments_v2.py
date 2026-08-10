import re

# Read the file
with open('/home/faisal/leaf-scan/src/data/treatments.ts', 'r') as f:
    lines = f.readlines()

# Join lines back into a string for easier processing
content = ''.join(lines)

# Step 1: Remove duplicate commas (replace ',,' with ',')
# We do this globally because the duplicate commas are only at the end of entries.
content = content.replace(',,', ',')

# Now, we want to extract the TREATMENTS object.
# We'll look for the pattern: export const TREATMENTS: Record<string, TreatmentInfo> = { ... };
# We'll capture the content inside the braces.
pattern = r'(export const TREATMENTS: Record<string, TreatmentInfo> = \{)(.*)(\};)'
match = re.search(pattern, content, re.DOTALL)

if not match:
    print("Error: Could not find TREATMENTS object")
    exit(1)

prefix = match.group(1)  # "export const TREATMENTS: Record<string, TreatmentInfo> = {"
inner = match.group(2)   # the content inside the braces
suffix = match.group(3)  # "};"

# Now, we need to split the inner content into entries.
# Each entry starts on a new line with two spaces, then a quote, then the key, then quote, colon, space, and opening brace.
# We'll split by the pattern: '\n  "'
# But note: the first entry might not have a newline before it? Actually, after the opening brace there is a newline and two spaces.
# Let's split the inner string by '\n  "'
# We'll keep the delimiter by using a capture group in the split? Alternatively, we can split and then add it back.

# We'll split the inner string by the regex: r'\n\s+"'
# But note: the indentation is exactly two spaces? We'll use r'\n  "'
parts = re.split(r'(\n  ")', inner)
# The split will give us: [part0, delimiter1, part1, delimiter2, part2, ...]
# The first part might be empty or might be the first entry without the delimiter? Actually, the string starts with the first entry?
# Let's examine: the inner string starts with a newline and two spaces? Actually, after the '{' there is a newline and then two spaces for the first entry.
# So the first element in the split will be an empty string? Let's test with a small example.

# Instead, let's do: we know that each entry (except possibly the first) is preceded by a newline and two spaces and a quote.
# We can iterate through the lines and build entries.

# Let's go back to line-by-line for clarity.

lines_inner = inner.split('\n')
entries = []
current_entry = []
in_entry = False
brace_count = 0

for line in lines_inner:
    stripped = line.strip()
    # Check if this line starts an entry: it begins with a quote, then a colon, then space and an opening brace?
    # Actually, the line looks like: '  "0": {'
    if not in_entry and re.match(r'\s*"[^"]+"\s*:\s*{', line):
        # Start of a new entry
        in_entry = True
        brace_count = 1  # we have seen the opening brace of the object
        current_entry = [line]
    elif in_entry:
        current_entry.append(line)
        # Update brace count: count '{' and '}'
        brace_count += line.count('{') - line.count('}')
        if brace_count == 0:
            # End of this entry
            entries.append('\n'.join(current_entry))
            in_entry = False
            current_entry = []
    # If we are not in an entry and the line is empty or just whitespace, we ignore (shouldn't happen in the middle)

print(f"Found {len(entries)} entries")

# Now process each entry to fix the key if needed
fixed_entries = []
for entry in entries:
    lines_entry = entry.split('\n')
    if not lines_entry:
        continue
    # First line: e.g., '  "0": {'
    first_line = lines_entry[0]
    # Extract the key from the first line
    match = re.match(r'\s*"([^"]+)"\s*:\s*{', first_line)
    if not match:
        # If we can't parse, keep as is
        fixed_entries.append(entry)
        continue
    key = match.group(1)
    # If the key is a number and in the range 11-55, we need to add 40
    if key.isdigit():
        num = int(key)
        if 11 <= num <= 55:
            new_key = str(num + 40)
            # Replace the key in the first line
            new_first_line = re.sub(r'\s*"[^"]+"', f'  "{new_key}"', first_line)
            lines_entry[0] = new_first_line
            # Also update the classId line inside the entry
            for i in range(1, len(lines_entry)):
                if 'classId:' in lines_entry[i]:
                    # Replace the quoted string after classId:
                    lines_entry[i] = re.sub(r'classId:\s*"[^"]+"', f'classId: "{new_key}"', lines_entry[i])
                    break
    # If the key is not a digit or not in range, leave it as is.
    fixed_entries.append('\n'.join(lines_entry))

# Join the fixed entries back together with a comma and newline between them
new_inner = ',\n'.join(fixed_entries)
# Reconstruct the content
new_content = f'{prefix}{new_inner}{suffix}'

# Write back to file
with open('/home/faisal/leaf-scan/src/data/treatments.ts', 'w') as f:
    f.write(new_content)

print("Fixed treatments.ts")

# Let's do a quick verification: check that we don't have duplicate commas and that the keys are corrected.
with open('/home/faisal/leaf-scan/src/data/treatments.ts', 'r') as f:
    fixed_content = f.read()

# Check for duplicate commas
if ',,' in fixed_content:
    print("ERROR: Still has duplicate commas!")
else:
    print("No duplicate commas found.")

# Check a few specific lines
lines_fixed = fixed_content.split('\n')
for i, line in enumerate(lines_fixed):
    if '"11":' in line:
        print(f"Line {i+1}: {line.rstrip()}")
        # Show next line
        if i+1 < len(lines_fixed):
            print(f"  Next: {lines_fixed[i+1].rstrip()}")
        break

for i, line in enumerate(lines_fixed):
    if '"51":' in line:
        print(f"Found 51 at line {i+1}: {line.rstrip()}")
        break