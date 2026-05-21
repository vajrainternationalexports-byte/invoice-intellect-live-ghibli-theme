import re
import zlib
import sys
import os

def extract_pdf_text(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return ""

    with open(pdf_path, 'rb') as f:
        content = f.read()

    # Find all streams
    # Streams are between b'stream' and b'endstream'
    # We also look for /Filter /FlateDecode in the stream's dictionary
    stream_pattern = re.compile(b'(\\d+)\\s+(\\d+)\\s+obj\\s*(<<.*?>>)\\s*stream\\r?\\n(.*?)\\r?\\nendstream', re.DOTALL)
    
    extracted_text = []
    
    for match in stream_pattern.finditer(content):
        obj_id = match.group(1).decode('ascii')
        obj_gen = match.group(2).decode('ascii')
        dict_data = match.group(3).decode('ascii', errors='ignore')
        stream_data = match.group(4)
        
        if 'FlateDecode' in dict_data:
            try:
                decompressed = zlib.decompress(stream_data)
                # Text in PDF streams is typically in TJ/Tj operators, inside parentheses: e.g., (text) Tj
                # Let's extract everything inside parentheses
                text_matches = re.findall(b'\\((.*?)\\)', decompressed)
                for tm in text_matches:
                    try:
                        decoded = tm.decode('utf-8', errors='ignore')
                        # Clean up some common PDF escape characters
                        decoded = decoded.replace('\\(', '(').replace('\\)', ')')
                        if len(decoded.strip()) > 1:
                            extracted_text.append(decoded.strip())
                    except Exception:
                        pass
            except Exception as e:
                # Sometimes zlib decompression fails if the match range was slightly off
                # Try decompressing with negative wbits for raw deflate
                try:
                    decompressed = zlib.decompress(stream_data, -zlib.MAX_WBITS)
                    text_matches = re.findall(b'\\((.*?)\\)', decompressed)
                    for tm in text_matches:
                        decoded = tm.decode('utf-8', errors='ignore')
                        if len(decoded.strip()) > 1:
                            extracted_text.append(decoded.strip())
                except Exception:
                    pass
        else:
            # Support for uncompressed raw PDF streams
            try:
                text_matches = re.findall(b'\\((.*?)\\)', stream_data)
                for tm in text_matches:
                    try:
                        decoded = tm.decode('utf-8', errors='ignore')
                        decoded = decoded.replace('\\(', '(').replace('\\)', ')')
                        if len(decoded.strip()) > 1:
                            extracted_text.append(decoded.strip())
                    except Exception:
                        pass
            except Exception:
                pass

    return " ".join(extracted_text)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 extract_pdf_text.py <path_to_pdf>")
    else:
        text = extract_pdf_text(sys.argv[1])
        print(f"--- EXTRACTED TEXT FROM {os.path.basename(sys.argv[1])} ---")
        print(text[:3000]) # print first 3000 chars

