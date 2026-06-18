import os
import re

target_dir = r'c:\Users\DINO\Desktop\DINO - Copy\frontend\src'
for root, _, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            def inject_font(match):
                tag = match.group(0)
                if 'font-semibold' in tag:
                    return tag
                
                # Check if it has a className
                class_match = re.search(r'className=([\'\"\`])(.*?)\1', tag)
                if class_match:
                    classes = class_match.group(2)
                    if 'font-' not in classes:
                        new_classes = classes + ' font-semibold'
                        return tag.replace(class_match.group(0), 'className=' + class_match.group(1) + new_classes + class_match.group(1))
                    else:
                        return tag
                else:
                    tag_name = re.match(r'<(h[1-6])', tag).group(1)
                    return tag.replace(f'<{tag_name}', f'<{tag_name} className=\"font-semibold\"')
            
            new_content = re.sub(r'<h[1-6]\b[^>]*>', inject_font, content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print('Updated ' + filepath)
