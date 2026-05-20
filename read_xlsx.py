import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def read_xlsx(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with zipfile.ZipFile(file_path, 'r') as zip_ref:
        # Load shared strings
        shared_strings = []
        if 'xl/sharedStrings.xml' in zip_ref.namelist():
            ss_content = zip_ref.read('xl/sharedStrings.xml')
            root = ET.fromstring(ss_content)
            # Find all <t> tags
            for t in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                shared_strings.append(t.text)

        # Load worksheet 1
        ws_content = zip_ref.read('xl/worksheets/sheet1.xml')
        root = ET.fromstring(ws_content)
        
        # Iterate rows
        rows = {}
        for row in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_idx = int(row.get('r'))
            rows[row_idx] = {}
            for cell in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                cell_ref = cell.get('r')
                cell_type = cell.get('t')
                val_node = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                if val_node is not None:
                    val = val_node.text
                    if cell_type == 's':
                        val = shared_strings[int(val)]
                    rows[row_idx][cell_ref] = val

        for r_idx in sorted(rows.keys()):
            cols = rows[r_idx]
            if cols:
                # Print cells in row ordered alphabetically by column letter
                print(f"Row {r_idx}: " + ", ".join([f"{k}:{v}" for k, v in sorted(cols.items(), key=lambda x: (len(x[0]), x[0]))]))

if __name__ == '__main__':
    read_xlsx('/Users/anjanagarwal/Downloads/Invoice-Intellect/attached_assets/Zinc_Statement_Sample_1_1774937945036.xlsx')
