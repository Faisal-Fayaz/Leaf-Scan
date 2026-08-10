#!/usr/bin/env python3

import re

def fix_treatments_file():
    file_path = '/home/faisal/leaf-scan/src/data/treatments.ts'
    
    # Read the file
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Process each line
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Look for lines that start with whitespace, then a quoted number, then ": {"
        # This matches the start of a treatment entry
        match = re.match(r'^(\s*)"(\d+)":\s*\{', line)
        if match:
            indent = match.group(1)
            old_num = int(match.group(2))
            
            # Check if this is in the range that needs fixing (11-55)
            if 11 <= old_num <= 55:
                new_num = old_num + 40  # 11->51, 12->52, ..., 55->95
                
                # Fix the key on this line
                lines[i] = f'{indent}"{new_num}": {{\n'
                
                # Now we need to find and fix the classId line within this entry
                # Look ahead for the line containing "classId:"
                j = i + 1
                while j < len(lines) and not lines[j].strip().startswith('classId:'):
                    j += 1
                
                if j < len(lines):
                    # Replace the old number with the new number in the classId line
                    # We'll use a different approach: 
                    # replace the quoted number after classId:
                    # Example: classId: "11",
                    # We want to change the 11 to 51
                    # We can use a regex that matches the number inside the quotes
                    old_line = lines[j]
                    # We'll split the line at the colon, then work on the second part.
                    # But easier: use re.sub with a pattern that matches the number inside quotes after classId:
                    # We'll capture the whole line and replace the number.
                    # Pattern: (classId:\s*")\d+(")
                    # Replacement: \1 + new_num + \2
                    # However, we had an error with the replacement string. Let's use a different method.
                    # We'll use: re.sub(r'(\d+)', new_num, old_line) but that might replace other numbers.
                    # Instead, we can match the pattern: classId: "(\d+)"
                    # Then replace the whole match with: f'classId: "{new_num}"'
                    new_line = re.sub(r'(classId:\s*")\d+(")', 
                                      lambda m: m.group(1) + str(new_num) + m.group(2), 
                                      old_line)
                    lines[j] = new_line
        
        i += 1
    
    # Write the fixed content back
    with open(file_path, 'w') as f:
        f.writelines(lines)
    
    print("Fixed treatments.txt: updated keys 11-55 to 51-95 and corresponding classId values")

if __name__ == '__main__':
    fix_treatments_file()