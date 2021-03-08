import random

n = 100

print("{ \"boxes\": [")
for i in range(n):
	print("{", end='')
	print(f"\"x\": {random.randint(-12, 12) * 2}", end='')
	print(", ", end='')
	print(f"\"y\": {random.randint(0,7)*2}", end='')
	print(", ", end='')
	print(f"\"z\": {random.randint(-12, 12) * 2}", end='')
	print("}", end='')
	if (i < n-1):
		print(",", end='')
print("]}")
