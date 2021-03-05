import random




print("{ \"boxes\": [")
for _ in range(0,50):
	print("{", end='')
	print(f"\"x\": {random.randint(-25, 25)}", end='')
	print(", ", end='')
	print(f"\"y\": {random.randint(1,15)}", end='')
	print(", ", end='')
	print(f"\"z\": {random.randint(-25, 25)}", end='')
	print("}, ")
print("]}")
