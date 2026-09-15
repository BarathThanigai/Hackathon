from neo4j import GraphDatabase
from dotenv import load_dotenv
import os
import certifi

os.environ["SSL_CERT_FILE"] = certifi.where()

load_dotenv()

URI = os.getenv("NEO4J_URI").replace("neo4j+s://", "bolt+s://")
USERNAME = os.getenv("NEO4J_USERNAME")
PASSWORD = os.getenv("NEO4J_PASSWORD")

print("URI:", URI)
print("USERNAME:", USERNAME)
print("PASSWORD:", "SET" if PASSWORD else "NOT SET")

try:
    driver = GraphDatabase.driver(
        URI,
        auth=(USERNAME, PASSWORD)
    )

    print("Driver created")

    driver.verify_connectivity()

    print("Connectivity verified")

    with driver.session() as session:
        result = session.run("RETURN 1 AS test")
        record = result.single()

        print("Query result:", record["test"])

except Exception as e:
    print("ERROR TYPE:", type(e).__name__)
    print("ERROR:", str(e))

finally:
    try:
        driver.close()
    except:
        pass