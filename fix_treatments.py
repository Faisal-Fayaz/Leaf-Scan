import re

with open('/home/faisal/leaf-scan/src/data/treatments.ts', 'r') as f:
    content = f.read()

# First, fix the double commas at the end of entries
# Replace ',,\n' with ',\n' but be careful not to break other things
# We'll do a global replace for ',,' -> ',' and hope it's safe
content = content.replace(',,', ',')

# Now, we need to fix the keys for the mislabeled block.
# We'll use a regex to find each entry in the TREATMENTS object.
# Pattern to match an entry: 
#   starts with whitespace, then a quote, then the key (digits or possibly other characters), then quote, colon, space, opening brace
#   then we capture everything until we see a line that ends with '},' (or just '}' if it's the last entry) but we'll do a simpler approach:
#   We'll match from the start of the entry to the next line that starts with whitespace and a quote (for the next entry) or the closing brace of the TREATMENTS object.

# However, given the structure is very regular, we can split by '\n  "' (newline, two spaces, quote) but note the first entry might not have a newline before it.

# Let's split the content by the pattern that starts an entry: '\n  "'
# We'll keep the delimiter.

# First, let's isolate the TREATMENTS object.
match = re.search(r'(export const TREATMENTS: Record<string, TreatmentInfo> = \{)(.*)(\};)', content, re.DOTALL)
if not match:
    print("Could not find TREATMENTS object")
    exit(1)

prefix = match.group(1)
inner = match.group(2)
suffix = match.group(3)

# Now split the inner part by lines, but we want to group lines into entries.
# We'll split by newline and then group lines that belong to the same entry.
lines = inner.split('\n')
entries = []
current_entry = []
in_entry = False
brace_count = 0

for line in lines:
    stripped = line.strip()
    if not in_entry and stripped.startswith('"') and ': {' in stripped:
        # Start of a new entry
        in_entry = True
        brace_count = 1  # we have seen the opening brace of the object
        current_entry = [line]
    elif in_entry:
        current_entry.append(line)
        # Update brace count: count opening and closing braces
        brace_count += line.count('{') - line.count('}')
        if brace_count == 0:
            # End of this entry
            entries.append('\n'.join(current_entry))
            in_entry = False
            current_entry = []

print(f"Found {len(entries)} entries")

# Now process each entry
fixed_entries = []
for entry in entries:
    lines = entry.split('\n')
    if not lines:
        continue
    # First line should be like: '  "0": {'
    first_line = lines[0]
    # Extract the key from the first line
    # Pattern: optional spaces, quote, key, quote, colon, space, {
    match = re.match(r'\s*"([^"]+)":\s*\{', first_line)
    if not match:
        # If we can't parse, keep as is
        fixed_entries.append(entry)
        continue
    key = match.group(1)
    # Check if key is a number and in the range 11-55
    if key.isdigit():
        key_int = int(key)
        if 11 <= key_int <= 55:
            new_key = str(key_int + 40)
            # Replace the key in the first line
            new_first_line = re.sub(r'\s*"[^"]+"', f'  "{new_key}"', first_line)
            lines[0] = new_first_line
            # Now we also need to update the classId line inside the entry
            # Look for a line that contains 'classId: "'
            for i in range(1, len(lines)):
                if 'classId:' in lines[i]:
                    # Replace the quoted string after classId:
                    lines[i] = re.sub(r'classId:\s*"[^"]+"', f'classId: "{new_key}"', lines[i])
                    break
            # Also, note: the entry might have a trailing comma after the closing brace? We'll leave it as is.
    # If key is not a digit or not in range, leave it as is.
    fixed_entries.append('\n'.join(lines))

# Join the entries back together with a comma and newline between them
new_inner = ',\n'.join(fixed_entries)
# Reconstruct the content
new_content = f'{prefix}{new_inner}{suffix}'

# Write back
with open('/home/faisal/leaf-scan/src/data/treatments.ts', 'w') as f:
    f.write(new_content)

print("Fixed the treatments.ts file.")

# Let's do a quick check: look for the line that was previously "  \"11\": {"
with open('/home/faisal/leaf-scan/src/data/treatments.ts', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if '"11":' in line:
            print(f"Line {i+1}: {line.rstrip()}")
            # Show next 2 lines
            for j in range(1, 3):
                if i+j < len(lines):
                    print(f"  Line {i+1+j}: {lines[i+j].rstrip()}")
            break

    # Also check for "51": now
    for i, line in enumerate(lines):
        if '"51":' in line:
            print(f"Found 51 at line {i+1}: {line.rstrip()}")
            break