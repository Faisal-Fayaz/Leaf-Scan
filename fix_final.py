#!/usr/bin/env python3

import re

def fix_treatments_file(file_path):
    # Read the file
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Step 1: Remove lines that are only a comma (with optional whitespace)
    new_lines = []
    for line in lines:
        if re.match(r'^\s*,\s*$', line):
            # Skip this line
            continue
        new_lines.append(line)
    
    # Join the lines back into a string
    content = ''.join(new_lines)
    
    # Step 2: Remove a trailing comma before the closing brace of the TREATMENTS object.
    # We look for a comma that is followed by optional whitespace, newline, optional whitespace, and then a closing brace.
    # We want to remove that comma.
    # We'll use a regex that matches: , followed by \n, then optional spaces, then }
    # But note: we don't want to match commas inside the entries.
    # We can be greedy and match the last such occurrence before the closing brace of the object.
    # However, a simpler approach: replace ',\n}' with '\n}' and ',\n\s*}' with '\n}'.
    # We'll do:
    #   Replace ',}' with '}' (in case there is no newline)
    #   Replace ',\n}' with '\n}'
    #   Replace ',\n\s*}' with '\n}'
    #
    # We'll do these in order.
    
    # First, handle the case of a comma directly before the closing brace (no newline)
    # This is unlikely but we'll do it.
    # We'll use a regex that matches a comma that is followed by optional whitespace and then a closing brace,
    # but we want to make sure we are at the end of the object. We'll do a global replace and hope it's safe.
    # However, note that there might be commas in the arrays (e.g., in organicTreatment) that are followed by a closing bracket and then a comma? 
    # Example: "organicTreatment": ["a","b","c"], 
    # Here, we have a comma after the closing bracket of the array. We don't want to touch that.
    #
    # To avoid false positives, we can anchor the match to the end of the string? But the closing brace of the object is not at the end of the string because there is the export and the getTreatment function after.
    #
    # Let's look at the structure of the file after the TREATMENTS object:
    #   ... };\n\nexport function getTreatment(classId: string): TreatmentInfo | null {\n   return TREATMENTS[classId] ?? null;\n}\n
    #
    # So the closing brace of the TREATMENTS object is followed by a semicolon, then a newline, then the function.
    #
    # Therefore, we can look for the pattern: };\n\nexport function
    #
    # We want to make sure that the comma we remove is before the closing brace that is followed by a semicolon and then the function.
    #
    # We can do: 
    #   Find the index of the substring '};' that closes the TREATMENTS object.
    #   Then, look backwards from that index to find the last comma that is not inside a string.
    #
    # Given the complexity and the fact that the file is not too large, we can do a simple approach:
    #   We know that the TREATMENTS object ends with the line that is just '};' (after the last entry).
    #   We can look for the line that is exactly '};' (with possible whitespace) and then check the line before it.
    #
    # Let's split the content by lines again and process.
    
    lines = content.split('\n')
    # We'll look for the index of the line that is the closing brace of the TREATMENTS object.
    # We know that after the TREatments object, there is a line that starts with 'export function getTreatment'
    # So we can find the index of the line that contains 'export function getTreatment'
    # Then, the line before that should be the closing brace of the object (possibly with a semicolon).
    
    # But note: there might be blank lines. We'll search for the line that contains 'export function getTreatment'
    # and then go backwards until we find a line that is not empty and is the closing brace.
    
    # Let's find the index of the line that contains 'export function getTreatment'
    export_func_index = -1
    for i, line in enumerate(lines):
        if 'export function getTreatment' in line:
            export_func_index = i
            break
    
    if export_func_index == -1:
        print("Warning: Could not find the export function line. Skipping trailing comma fix.")
    else:
        # Now, go backwards from export_func_index to find the line that is the closing brace of the TREATMENTS object.
        j = export_func_index - 1
        while j >= 0 and (lines[j].strip() == '' or lines[j].strip() == '}'):
            if lines[j].strip() == '}':
                # We found the closing brace line. Now, check if the line before it ends with a comma.
                k = j - 1
                while k >= 0 and lines[k].strip() == '':
                    k -= 1
                if k >= 0:
                    # Check if line k ends with a comma (after stripping whitespace)
                    if lines[k].rstrip().endswith(','):
                        # Remove the trailing comma from line k
                        lines[k] = lines[k].rstrip()[:-1] + '\n'
                        print(f"Removed trailing comma from line {k+1}")
                break
            j -= 1
    
    # Join the lines back
    content = '\n'.join(lines)
    
    # Write back to file
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("Fixed duplicate commas and trailing comma in treatments.ts")

if __name__ == '__main__':
    fix_treatments_file('/home/faisal/leaf-scan/src/data/treatments.ts')