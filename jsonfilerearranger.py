import json
import random

# Read your file
with open('questions_120pm_26Oct2025.json', 'r') as f:
    data = json.load(f)

# Shuffle all options
for item in data:
    if 'options' in item:
        correct = item['answer']
        options = item['options']
        random.shuffle(options)
        # Answer remains correct, just position changes

# Save shuffled version
with open('questions_shuffled.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Shuffled {len(data)} questions successfully!")