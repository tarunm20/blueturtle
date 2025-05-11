import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import execute_values
import time

# Initialize Faker
fake = Faker()
fake.seed_instance(42)  # For reproducibility

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

# Database connection parameters (replace with your Supabase details)
db_params = {
    'host': 'db.wpwdzcrofuexfrvqhwox.supabase.co',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'blueturtlesample123',
    'port': '5432'
}

# Constants for data generation
NUM_CATEGORIES = 10
NUM_BRANDS = 15
NUM_PRODUCTS = 200
NUM_ADDRESSES = 500
NUM_CUSTOMERS = 500
NUM_WAREHOUSES = 5
NUM_MARKETING_CAMPAIGNS = 20
NUM_ORDERS = 5000
NUM_WEBSITE_TRAFFIC_DAYS = 365
NUM_PRODUCT_TAGS = 30

# Date ranges
START_DATE = datetime(2022, 1, 1)
END_DATE = datetime(2024, 4, 30)

def random_date(start_date, end_date):
    """Generate a random date between start_date and end_date"""
    time_delta = end_date - start_date
    random_days = random.randint(0, time_delta.days)
    return start_date + timedelta(days=random_days)

def connect_to_db():
    """Connect to the Supabase database"""
    try:
        conn = psycopg2.connect(**db_params)
        print("Database connection established successfully")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise

def clear_all_tables(conn):
    """Clear all existing data from the tables"""
    cursor = conn.cursor()
    
    # List of tables in order of dependencies
    tables = [
        "sales_targets", "product_tag_relationships", "product_tags",
        "customer_segment_memberships", "customer_segments",
        "payment_methods", "shipping_methods", "promotions",
        "website_traffic", "product_reviews", "campaign_performance",
        "marketing_campaigns", "order_items", "orders",
        "product_inventory", "warehouses", "customers",
        "addresses", "products", "brands", "categories"
    ]
    
    for table in tables:
        try:
            cursor.execute(f"TRUNCATE TABLE {table} CASCADE;")
            print(f"Cleared table: {table}")
        except Exception as e:
            print(f"Error clearing table {table}: {e}")
    
    conn.commit()
    print("All tables cleared successfully")

def reset_sequences(conn):
    """Reset all sequence IDs to 1"""
    cursor = conn.cursor()
    sequences = [
        "categories_id_seq", "brands_id_seq", "products_id_seq",
        "addresses_id_seq", "customers_id_seq", "warehouses_id_seq",
        "product_inventory_id_seq", "orders_id_seq", "order_items_id_seq",
        "marketing_campaigns_id_seq", "campaign_performance_id_seq",
        "product_reviews_id_seq", "website_traffic_id_seq",
        "promotions_id_seq", "shipping_methods_id_seq",
        "payment_methods_id_seq", "customer_segments_id_seq",
        "customer_segment_memberships_id_seq", "product_tags_id_seq",
        "product_tag_relationships_id_seq", "sales_targets_id_seq"
    ]
    
    for seq in sequences:
        try:
            cursor.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1;")
            print(f"Reset sequence: {seq}")
        except Exception as e:
            print(f"Error resetting sequence {seq}: {e}")
    
    conn.commit()
    print("All sequences reset successfully")

def generate_categories(conn):
    """Generate and insert category data"""
    cursor = conn.cursor()
    
    # Main categories (no parent)
    main_categories = [
        {"name": "Electronics", "description": "Electronic devices and gadgets"},
        {"name": "Clothing", "description": "Apparel and fashion items"},
        {"name": "Home & Kitchen", "description": "Products for home and kitchen"},
        {"name": "Books", "description": "Books and literature"},
        {"name": "Sports & Outdoors", "description": "Sports equipment and outdoor gear"}
    ]
    
    # Subcategories with parent references
    subcategories = [
        {"name": "Smartphones", "description": "Mobile phones and accessories", "parent": "Electronics"},
        {"name": "Laptops", "description": "Portable computers", "parent": "Electronics"},
        {"name": "Audio", "description": "Headphones and speakers", "parent": "Electronics"},
        {"name": "Men's Clothing", "description": "Clothing for men", "parent": "Clothing"},
        {"name": "Women's Clothing", "description": "Clothing for women", "parent": "Clothing"},
        {"name": "Furniture", "description": "Home and office furniture", "parent": "Home & Kitchen"},
        {"name": "Kitchenware", "description": "Kitchen tools and appliances", "parent": "Home & Kitchen"},
        {"name": "Fiction", "description": "Fiction books", "parent": "Books"},
        {"name": "Non-Fiction", "description": "Non-fiction books", "parent": "Books"},
        {"name": "Fitness", "description": "Fitness equipment", "parent": "Sports & Outdoors"}
    ]
    
    # Insert main categories first
    for category in main_categories:
        cursor.execute(
            """
            INSERT INTO categories (name, description, image_url, created_at)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
            """,
            (
                category["name"],
                category["description"],
                f"https://example.com/{category['name'].lower().replace(' & ', '-').replace(' ', '-')}.jpg",
                random_date(START_DATE, END_DATE)
            )
        )
    
    conn.commit()
    
    # Get main categories with IDs
    cursor.execute("SELECT id, name FROM categories")
    category_id_map = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Insert subcategories with parent references
    for subcategory in subcategories:
        parent_id = category_id_map.get(subcategory["parent"])
        cursor.execute(
            """
            INSERT INTO categories (name, description, parent_category_id, image_url, created_at)
            VALUES (%s, %s, %s, %s, %s);
            """,
            (
                subcategory["name"],
                subcategory["description"],
                parent_id,
                f"https://example.com/{subcategory['name'].lower().replace(' ', '-')}.jpg",
                random_date(START_DATE, END_DATE)
            )
        )
    
    conn.commit()
    print(f"Generated {len(main_categories) + len(subcategories)} categories")

def generate_brands(conn):
    """Generate and insert brand data"""
    cursor = conn.cursor()
    
    brands = [
        {"name": "TechGiant", "country": "USA", "year": 1976, "description": "Leading technology company"},
        {"name": "FashionForward", "country": "France", "year": 1985, "description": "Trendy clothing brand"},
        {"name": "HomeComfort", "country": "Sweden", "year": 1990, "description": "Home furnishing specialists"},
        {"name": "SmartDevices", "country": "South Korea", "year": 2002, "description": "Innovative smart device manufacturer"},
        {"name": "StyleCo", "country": "Italy", "year": 1972, "description": "High-end fashion brand"},
        {"name": "KitchenPro", "country": "Germany", "year": 1953, "description": "Premium kitchenware"},
        {"name": "BudgetTech", "country": "China", "year": 2010, "description": "Affordable technology products"},
        {"name": "LuxuryLiving", "country": "USA", "year": 1998, "description": "Luxury home furnishings"},
        {"name": "ReadMore", "country": "UK", "year": 1955, "description": "Quality book publisher"},
        {"name": "OutdoorGear", "country": "Canada", "year": 2005, "description": "Outdoor and adventure equipment"},
        {"name": "ElectroWorld", "country": "Japan", "year": 1982, "description": "Electronic products manufacturer"},
        {"name": "FitLife", "country": "USA", "year": 2008, "description": "Fitness and sports equipment"},
        {"name": "ClassicLit", "country": "UK", "year": 1901, "description": "Classic literature publisher"},
        {"name": "ModernHome", "country": "Denmark", "year": 1995, "description": "Modern home furnishings"},
        {"name": "TrendyTech", "country": "Taiwan", "year": 2015, "description": "Latest technology products"}
    ]
    
    for brand in brands:
        cursor.execute(
            """
            INSERT INTO brands (name, country_of_origin, founded_year, description, logo_url, created_at)
            VALUES (%s, %s, %s, %s, %s, %s);
            """,
            (
                brand["name"],
                brand["country"],
                brand["year"],
                brand["description"],
                f"https://example.com/logos/{brand['name'].lower()}.jpg",
                random_date(START_DATE, END_DATE)
            )
        )
    
    conn.commit()
    print(f"Generated {len(brands)} brands")

def generate_products(conn):
    """Generate and insert product data"""
    cursor = conn.cursor()
    
    # Get categories
    cursor.execute("SELECT id, name FROM categories")
    categories = cursor.fetchall()
    category_dict = {row[1]: row[0] for row in categories}
    
    # Get brands
    cursor.execute("SELECT id, name FROM brands")
    brands = cursor.fetchall()
    
    # Product templates by category
    product_templates = {
        "Smartphones": [
            {"prefix": ["Premium", "Ultra", "Pro", "Smart", "Next-Gen"], 
             "name": ["Phone", "Mobile", "Smartphone", "Communicator", "Connect"],
             "brand_indices": [0, 6, 10, 14],  # Indices of tech brands
             "price_range": (399, 1299)},
        ],
        "Laptops": [
            {"prefix": ["Pro", "Ultra", "Elite", "Power", "Slim"], 
             "name": ["Book", "Laptop", "Notebook", "Workstation", "PC"],
             "brand_indices": [0, 6, 10, 14],
             "price_range": (599, 2499)},
        ],
        "Audio": [
            {"prefix": ["Sound", "Bass", "Clear", "Ultra", "Premium"], 
             "name": ["Headphones", "Earbuds", "Speaker", "SoundBar", "AudioSystem"],
             "brand_indices": [0, 6, 10],
             "price_range": (49, 499)},
        ],
        "Men's Clothing": [
            {"prefix": ["Classic", "Modern", "Slim-Fit", "Casual", "Elegant"], 
             "name": ["Shirt", "Pants", "Jacket", "Sweater", "T-Shirt"],
             "brand_indices": [1, 4],
             "price_range": (19, 199)},
        ],
        "Women's Clothing": [
            {"prefix": ["Stylish", "Trendy", "Elegant", "Casual", "Designer"], 
             "name": ["Dress", "Blouse", "Skirt", "Jeans", "Top"],
             "brand_indices": [1, 4],
             "price_range": (24, 249)},
        ],
        "Furniture": [
            {"prefix": ["Modern", "Classic", "Luxury", "Comfort", "Minimalist"], 
             "name": ["Sofa", "Chair", "Table", "Bed", "Desk"],
             "brand_indices": [2, 7, 13],
             "price_range": (99, 1999)},
        ],
        "Kitchenware": [
            {"prefix": ["Professional", "Deluxe", "Chef's", "Premium", "Essential"], 
             "name": ["Blender", "Mixer", "Knife Set", "Cookware", "Utensils"],
             "brand_indices": [5, 7],
             "price_range": (29, 399)},
        ],
        "Fiction": [
            {"prefix": ["The", "A", "Adventures of", "Tales of", "Journey to"], 
             "name": ["Mystery", "Adventure", "Love Story", "Fantasy", "Thriller"],
             "brand_indices": [8, 12],
             "price_range": (9, 29)},
        ],
        "Non-Fiction": [
            {"prefix": ["The Art of", "Guide to", "Understanding", "Mastering", "Exploring"], 
             "name": ["Success", "Productivity", "Happiness", "Business", "Science"],
             "brand_indices": [8, 12],
             "price_range": (14, 39)},
        ],
        "Fitness": [
            {"prefix": ["Pro", "Power", "Fitness", "Training", "High-Performance"], 
             "name": ["Weights", "Mat", "Machine", "Treadmill", "Bike"],
             "brand_indices": [9, 11],
             "price_range": (19, 1499)},
        ]
    }
    
    # Generate products
    products = []
    
    for category_name, templates in product_templates.items():
        category_id = category_dict.get(category_name)
        if not category_id:
            continue
            
        # Determine how many products to create for this category
        num_products = random.randint(15, 30)
        
        for _ in range(num_products):
            template = random.choice(templates)
            prefix = random.choice(template["prefix"])
            name = random.choice(template["name"])
            brand_index = random.choice(template["brand_indices"])
            brand_id = brands[brand_index][0]
            price_min, price_max = template["price_range"]
            
            price = round(random.uniform(price_min, price_max), 2)
            cost = round(price * random.uniform(0.4, 0.7), 2)
            discount = random.choice([0, 0, 0, 5, 10, 15, 20])  # 0 is more common
            
            product_name = f"{prefix} {name}"
            if len(product_name) > 100:
                product_name = product_name[:100]
                
            sku = f"{category_name[:3].upper()}-{brand_id}-{random.randint(10000, 99999)}"
            
            # Generate color based on category
            if category_name in ["Men's Clothing", "Women's Clothing"]:
                color = random.choice(["Black", "White", "Blue", "Red", "Green", "Gray", "Navy", "Beige"])
            elif category_name in ["Smartphones", "Laptops"]:
                color = random.choice(["Black", "Silver", "Space Gray", "White", "Gold"])
            elif category_name in ["Furniture"]:
                color = random.choice(["Oak", "Walnut", "White", "Black", "Gray", "Natural"])
            else:
                color = random.choice(["Black", "White", "Silver", "Multi"])
                
            created_at = random_date(START_DATE, END_DATE)
            updated_at = created_at + timedelta(days=random.randint(0, 180))
            
            cursor.execute(
                """
                INSERT INTO products (
                    name, description, category_id, brand_id, price, cost, 
                    discount_percent, weight, dimensions, color, sku, 
                    created_at, updated_at, is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    product_name,
                    fake.paragraph(nb_sentences=3, variable_nb_sentences=True),
                    category_id,
                    brand_id,
                    price,
                    cost,
                    discount,
                    random.uniform(0.1, 10.0),  # weight
                    f"{random.randint(1, 100)}x{random.randint(1, 100)}x{random.randint(1, 100)}",  # dimensions
                    color,
                    sku,
                    created_at,
                    updated_at,
                    random.random() > 0.05  # 5% chance of being inactive
                )
            )
    
    conn.commit()
    
    # Get count of products
    cursor.execute("SELECT COUNT(*) FROM products")
    product_count = cursor.fetchone()[0]
    print(f"Generated {product_count} products")

def generate_addresses(conn):
    """Generate and insert address data"""
    cursor = conn.cursor()
    
    address_types = ["shipping", "billing", "both"]
    
    for _ in range(NUM_ADDRESSES):
        address_type = random.choice(address_types)
        
        cursor.execute(
            """
            INSERT INTO addresses (
                address_line1, address_line2, city, state, postal_code, 
                country, is_default, address_type, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """,
            (
                fake.street_address(),
                fake.secondary_address() if random.random() > 0.7 else None,
                fake.city(),
                fake.state_abbr(),
                fake.zipcode(),
                "USA",  # Keeping it simple with just USA
                random.random() > 0.8,  # 20% chance of being default
                address_type,
                random_date(START_DATE, END_DATE)
            )
        )
    
    conn.commit()
    print(f"Generated {NUM_ADDRESSES} addresses")

def generate_customers(conn):
    """Generate and insert customer data"""
    cursor = conn.cursor()
    
    # Get addresses
    cursor.execute("SELECT id FROM addresses")
    address_ids = [row[0] for row in cursor.fetchall()]
    
    # Create loyalty tiers
    loyalty_tiers = ["bronze", "silver", "gold", "platinum"]
    tier_weights = [0.5, 0.3, 0.15, 0.05]  # Probabilities
    
    # Create acquisition sources
    acquisition_sources = ["organic_search", "paid_search", "social_media", "email", "referral", "direct"]
    source_weights = [0.25, 0.2, 0.2, 0.1, 0.15, 0.1]  # Probabilities
    
    for _ in range(NUM_CUSTOMERS):
        first_name = fake.first_name()
        last_name = fake.last_name()
        
        # Assign customer to an address
        address_id = random.choice(address_ids)
        
        # Generate creation date
        created_at = random_date(START_DATE, END_DATE)
        
        # Generate last login date (might be after creation date)
        last_login = None
        if random.random() > 0.1:  # 90% chance of having logged in
            days_since_creation = (END_DATE - created_at).days
            if days_since_creation > 0:
                last_login = created_at + timedelta(days=random.randint(0, days_since_creation))
        
        # Assign acquisition source with weighted probability
        acquisition_source = random.choices(acquisition_sources, weights=source_weights, k=1)[0]
        
        # Assign loyalty tier with weighted probability
        loyalty_tier = random.choices(loyalty_tiers, weights=tier_weights, k=1)[0]
        
        # Generate lifetime value based on loyalty tier
        if loyalty_tier == "bronze":
            lifetime_value = random.uniform(10, 200)
        elif loyalty_tier == "silver":
            lifetime_value = random.uniform(201, 500)
        elif loyalty_tier == "gold":
            lifetime_value = random.uniform(501, 1000)
        else:  # platinum
            lifetime_value = random.uniform(1001, 5000)

        phone = fake.phone_number() if random.random() > 0.2 else None
        if phone and len(phone) > 20:
            phone = phone[:20]  # Truncate to 20 characters
        
        cursor.execute(
            """
            INSERT INTO customers (
                first_name, last_name, email, phone, birth_date, gender,
                address_id, created_at, last_login, acquisition_source,
                loyalty_tier, lifetime_value
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """,
            (
                first_name,
                last_name,
                fake.email(),
                phone,  # 80% have phone numbers
                fake.date_of_birth(minimum_age=18, maximum_age=90) if random.random() > 0.3 else None,  # 70% have birthdate
                random.choice(["male", "female", "other", "prefer not to say"]) if random.random() > 0.2 else None,
                address_id,
                created_at,
                last_login,
                acquisition_source,
                loyalty_tier,
                round(lifetime_value, 2)
            )
        )
    
    conn.commit()
    print(f"Generated {NUM_CUSTOMERS} customers")

def generate_warehouses(conn):
    """Generate and insert warehouse data"""
    cursor = conn.cursor()
    
    # Get addresses for warehouses
    cursor.execute("SELECT id FROM addresses LIMIT %s", (NUM_WAREHOUSES,))
    warehouse_addresses = [row[0] for row in cursor.fetchall()]
    
    warehouse_names = [
        "East Coast Distribution Center",
        "West Coast Fulfillment Center",
        "Central Warehouse",
        "Southern Logistics Hub",
        "Northern Storage Facility"
    ]
    
    for i in range(NUM_WAREHOUSES):
        cursor.execute(
            """
            INSERT INTO warehouses (
                name, address_id, capacity, operating_cost, manager_name, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s);
            """,
            (
                warehouse_names[i],
                warehouse_addresses[i],
                random.randint(5000, 50000),  # capacity
                random.uniform(10000, 100000),  # operating cost
                fake.name(),
                random_date(START_DATE, END_DATE)
            )
        )
    
    conn.commit()
    print(f"Generated {NUM_WAREHOUSES} warehouses")

def generate_product_inventory(conn):
    """Generate and insert product inventory data"""
    cursor = conn.cursor()
    
    # Get products
    cursor.execute("SELECT id FROM products")
    product_ids = [row[0] for row in cursor.fetchall()]
    
    # Get warehouses
    cursor.execute("SELECT id FROM warehouses")
    warehouse_ids = [row[0] for row in cursor.fetchall()]
    
    # Create inventory entries for each product in 1-3 warehouses
    for product_id in product_ids:
        # Choose 1-3 warehouses for this product
        num_warehouses = random.randint(1, min(3, len(warehouse_ids)))
        product_warehouses = random.sample(warehouse_ids, num_warehouses)
        
        for warehouse_id in product_warehouses:
            # Generate quantity available (higher for more popular products)
            quantity_available = random.randint(0, 500)
            
            # Some products might be reserved
            quantity_reserved = random.randint(0, min(50, quantity_available))
            
            # Generate restock threshold
            restock_threshold = int(quantity_available * 0.2)
            
            # Dates for last and next restock
            last_restock_date = random_date(START_DATE, END_DATE - timedelta(days=30))
            next_restock_date = last_restock_date + timedelta(days=random.randint(30, 90))
            
            cursor.execute(
                """
                INSERT INTO product_inventory (
                    product_id, warehouse_id, quantity_available, quantity_reserved,
                    restock_threshold, last_restock_date, next_restock_date,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    product_id,
                    warehouse_id,
                    quantity_available,
                    quantity_reserved,
                    restock_threshold,
                    last_restock_date,
                    next_restock_date,
                    random_date(START_DATE, END_DATE - timedelta(days=90)),
                    random_date(END_DATE - timedelta(days=90), END_DATE)
                )
            )
    
    conn.commit()
    
    # Get count of inventory records
    cursor.execute("SELECT COUNT(*) FROM product_inventory")
    inventory_count = cursor.fetchone()[0]
    print(f"Generated {inventory_count} inventory records")

def generate_marketing_campaigns(conn):
    """Generate and insert marketing campaign data"""
    cursor = conn.cursor()
    
    campaign_names = [
        "Summer Sale", "Back to School", "Black Friday", "Holiday Season",
        "New Year Clearance", "Spring Collection", "Anniversary Sale",
        "Customer Appreciation", "Flash Sale", "Loyalty Rewards",
        "Mobile App Promotion", "Social Media Campaign", "Email Newsletter",
        "Product Launch", "Referral Program", "Discount Days",
        "Free Shipping Promo", "Weekend Special", "Limited Time Offer", "Seasonal Promotion"
    ]
    
    channels = ["email", "social_media", "search", "display", "affiliate", "direct_mail"]
    conversion_goals = ["purchase", "signup", "app_download", "page_visit", "add_to_cart"]
    
    for i in range(min(NUM_MARKETING_CAMPAIGNS, len(campaign_names))):
        # Generate campaign dates
        start_date = random_date(START_DATE, END_DATE - timedelta(days=60))
        end_date = start_date + timedelta(days=random.randint(7, 60))
        
        cursor.execute(
            """
            INSERT INTO marketing_campaigns (
                name, description, start_date, end_date, budget,
                target_audience, channel, conversion_goal, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """,
            (
                campaign_names[i],
                fake.paragraph(nb_sentences=2),
                start_date,
                end_date,
                random.uniform(1000, 50000),  # budget
                random.choice(["new_customers", "existing_customers", "all"]),
                random.choice(channels),
                random.choice(conversion_goals),
                start_date - timedelta(days=random.randint(7, 30)),  # created before start date
                start_date - timedelta(days=random.randint(1, 7))  # updated after creation but before start
            )
        )
    
    conn.commit()
    print(f"Generated {NUM_MARKETING_CAMPAIGNS} marketing campaigns")

def generate_campaign_performance(conn):
    """Generate and insert campaign performance data"""
    cursor = conn.cursor()
    
    # Get all campaign IDs and their start/end dates
    cursor.execute("SELECT id, start_date, end_date FROM marketing_campaigns")
    campaigns = cursor.fetchall()
    
    for campaign in campaigns:
        campaign_id, start_date, end_date = campaign
        
        # Calculate number of days in campaign
        if not start_date or not end_date:
            continue
            
        campaign_days = (end_date - start_date).days + 1
        
        # Generate daily performance for each day of the campaign
        for day in range(campaign_days):
            current_date = start_date + timedelta(days=day)
            
            # Performance metrics with some randomness but also trends
            # More conversions later in campaign, higher costs at beginning
            day_ratio = day / max(1, campaign_days - 1)  # 0 to 1
            
            # Basic metrics
            impressions = int(random.normalvariate(5000, 1000) * (1 + day_ratio * 0.2))
            clicks = int(impressions * random.uniform(0.01, 0.05))  # 1-5% CTR
            cost = round(clicks * random.uniform(0.5, 2.0), 2)  # $0.50-$2 CPC
            
            # Conversions tend to increase as campaign progresses
            conversion_rate = random.uniform(0.02, 0.08) * (1 + day_ratio * 0.5)
            conversions = int(clicks * conversion_rate)
            
            # Revenue increases as campaign becomes more optimized
            avg_order_value = random.uniform(50, 200)
            revenue = round(conversions * avg_order_value * (1 + day_ratio * 0.3), 2)
            
            cursor.execute(
                """
                INSERT INTO campaign_performance (
                    campaign_id, date, impressions, clicks, cost,
                    conversions, revenue_attributed, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    campaign_id,
                    current_date,
                    impressions,
                    clicks,
                    cost,
                    conversions,
                    revenue,
                    current_date + timedelta(days=1)  # created next day after performance
                )
            )
    
    conn.commit()
    
    # Get count of performance records
    cursor.execute("SELECT COUNT(*) FROM campaign_performance")
    performance_count = cursor.fetchone()[0]
    print(f"Generated {performance_count} campaign performance records")

def generate_shipping_methods(conn):
    """Generate shipping methods"""
    cursor = conn.cursor()
    
    shipping_methods = [
        {"name": "Standard Shipping", "description": "Delivery in 5-7 business days", "price": 5.99, "days": 6},
        {"name": "Express Shipping", "description": "Delivery in 2-3 business days", "price": 12.99, "days": 3},
        {"name": "Next Day Delivery", "description": "Delivery the next business day", "price": 19.99, "days": 1},
        {"name": "Free Economy Shipping", "description": "Free shipping for orders over $50 (7-10 days)", "price": 0, "days": 8},
        {"name": "International Shipping", "description": "Delivery to international addresses in 10-14 days", "price": 29.99, "days": 12}
    ]
    
    for method in shipping_methods:
        cursor.execute(
            """
            INSERT INTO shipping_methods (name, description, price, estimated_days, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s);
            """,
            (
                method["name"],
                method["description"],
                method["price"],
                method["days"],
                True,
                random_date(START_DATE, END_DATE)
            )
        )
    
    conn.commit()
    print(f"Generated {len(shipping_methods)} shipping methods")

def generate_payment_methods(conn):
    """Generate payment methods"""
    cursor = conn.cursor()
    
    payment_methods = [
        {"name": "Credit Card", "description": "Pay with Visa, MasterCard, Amex, or Discover"},
        {"name": "PayPal", "description": "Pay using your PayPal account"},
        {"name": "Apple Pay", "description": "Quick payment with Apple Pay"},
        {"name": "Google Pay", "description": "Fast checkout with Google Pay"},
        {"name": "Bank Transfer", "description": "Direct bank transfer"}
    ]
    
    for method in payment_methods:
        cursor.execute(
            """
            INSERT INTO payment_methods (name, description, is_active, created_at)
            VALUES (%s, %s, %s, %s);
            """,
            (
                method["name"],
                method["description"],
                True,
                random_date(START_DATE, END_DATE)
            )
        )
    
    conn.commit()
    print(f"Generated {len(payment_methods)} payment methods")

def generate_customer_segments(conn):
    """Generate customer segments"""
    cursor = conn.cursor()
    
    segments = [
        {"name": "New Customers", "description": "Customers who registered in the last 30 days", 
         "criteria": "created_at >= current_date - interval '30 days'"},
        {"name": "High-Value Customers", "description": "Customers with lifetime value over $1000", 
         "criteria": "lifetime_value > 1000"},
        {"name": "Inactive Customers", "description": "Customers who haven't made a purchase in 90+ days", 
         "criteria": "last_order_date < current_date - interval '90 days'"},
        {"name": "Frequent Shoppers", "description": "Customers who've made 5+ purchases", 
         "criteria": "order_count >= 5"},
        {"name": "Electronics Buyers", "description": "Customers who've purchased from the Electronics category", 
         "criteria": "has_purchased_category = 'Electronics'"}
    ]
    
    for segment in segments:
        cursor.execute(
            """
            INSERT INTO customer_segments (name, description, criteria, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s);
            """,
            (
                segment["name"],
                segment["description"],
                segment["criteria"],
                random_date(START_DATE, END_DATE),
                random_date(START_DATE, END_DATE)
            )
        )
    
    conn.commit()
    
    # Get the segments back for the next function
    cursor.execute("SELECT id, name FROM customer_segments")
    segment_ids = {row[1]: row[0] for row in cursor.fetchall()}
    
    print(f"Generated {len(segments)} customer segments")
    
    return segment_ids

def generate_product_tags(conn):
    """Generate product tags"""
    cursor = conn.cursor()
    
    tags = [
        "Sale", "New Arrival", "Best Seller", "Limited Edition", "Clearance",
        "Eco-Friendly", "Premium", "Award Winning", "Staff Pick", "Trending",
        "Handmade", "Exclusive", "Free Shipping", "Gift Idea", "Organic",
        "Vegan", "High Quality", "Sustainable", "Imported", "Local",
        "Top Rated", "Popular", "Featured", "Seasonal", "Discounted",
        "Special", "Classic", "Modern", "Vintage", "Custom"
    ]
    
    for tag in tags:
        cursor.execute(
            """
            INSERT INTO product_tags (name, created_at)
            VALUES (%s, %s);
            """,
            (
                tag,
                random_date(START_DATE, END_DATE)
            )
        )
    
    conn.commit()
    print(f"Generated {len(tags)} product tags")
    
    # Get tag IDs for the next function
    cursor.execute("SELECT id, name FROM product_tags")
    tag_ids = {row[1]: row[0] for row in cursor.fetchall()}
    
    return tag_ids

def generate_product_tag_relationships(conn, tag_ids):
    """Generate relationships between products and tags"""
    cursor = conn.cursor()
    
    # Get all products
    cursor.execute("SELECT id FROM products")
    product_ids = [row[0] for row in cursor.fetchall()]
    
    # Create tag relationships
    relationships = []
    
    for product_id in product_ids:
        # Assign 1-4 tags to each product
        num_tags = random.randint(1, 4)
        tag_names = random.sample(list(tag_ids.keys()), num_tags)
        
        for tag_name in tag_names:
            tag_id = tag_ids[tag_name]
            
            # Check if relationship already exists
            if (product_id, tag_id) in relationships:
                continue
                
            relationships.append((product_id, tag_id))
            
            cursor.execute(
                """
                INSERT INTO product_tag_relationships (product_id, tag_id, created_at)
                VALUES (%s, %s, %s);
                """,
                (
                    product_id,
                    tag_id,
                    random_date(START_DATE, END_DATE)
                )
            )
    
    conn.commit()
    print(f"Generated {len(relationships)} product tag relationships")

def generate_customer_segment_memberships(conn, segment_ids):
    """Generate customer segment memberships"""
    cursor = conn.cursor()
    
    # Get all customers
    cursor.execute("SELECT id, loyalty_tier, lifetime_value, created_at FROM customers")
    customers = cursor.fetchall()
    
    # Map segments to criteria functions
    segment_criteria = {
        "New Customers": lambda customer: (END_DATE - customer[3]).days <= 30,
        "High-Value Customers": lambda customer: customer[2] > 1000,
        "Inactive Customers": lambda customer: random.random() < 0.3,  # 30% chance (simplified)
        "Frequent Shoppers": lambda customer: customer[1] in ["gold", "platinum"],
        "Electronics Buyers": lambda customer: random.random() < 0.4  # 40% chance (simplified)
    }
    
    # Create memberships
    memberships = []
    
    for customer in customers:
        customer_id = customer[0]
        
        for segment_name, criteria_func in segment_criteria.items():
            if segment_name not in segment_ids:
                continue
                
            segment_id = segment_ids[segment_name]
            
            # Apply criteria
            if criteria_func(customer):
                # Check if membership already exists
                if (customer_id, segment_id) in memberships:
                    continue
                    
                memberships.append((customer_id, segment_id))
                
                cursor.execute(
                    """
                    INSERT INTO customer_segment_memberships (customer_id, segment_id, added_at)
                    VALUES (%s, %s, %s);
                    """,
                    (
                        customer_id,
                        segment_id,
                        random_date(START_DATE, END_DATE)
                    )
                )
    
    conn.commit()
    print(f"Generated {len(memberships)} customer segment memberships")

def generate_orders_and_items(conn):
    """Generate orders and order items"""
    cursor = conn.cursor()
    
    # Get customers
    cursor.execute("SELECT id, created_at FROM customers")
    customers = cursor.fetchall()
    
    # Get products with their prices
    cursor.execute("SELECT id, price, discount_percent FROM products")
    products = cursor.fetchall()
    
    # Get shipping methods
    cursor.execute("SELECT id, price FROM shipping_methods")
    shipping_methods = cursor.fetchall()
    
    # Get payment methods
    cursor.execute("SELECT id FROM payment_methods")
    payment_methods = cursor.fetchall()
    
    # Get addresses
    cursor.execute("SELECT id, customer_id FROM addresses WHERE address_type IN ('shipping', 'both')")
    shipping_addresses = cursor.fetchall()
    cursor.execute("SELECT id, customer_id FROM addresses WHERE address_type IN ('billing', 'both')")
    billing_addresses = cursor.fetchall()
    
    # Prepare storage for orders and order items
    orders_created = 0
    order_items_created = 0
    
    # Create order status probabilities
    order_statuses = ["pending", "processing", "shipped", "delivered", "canceled", "returned"]
    status_weights = [0.05, 0.1, 0.2, 0.55, 0.05, 0.05]  # Probabilities
    
    # Create orders with seasonal patterns
    for customer_data in customers:
        customer_id, customer_created_at = customer_data
        
        # Generate 0-10 orders per customer with weighted probability
        # More orders for older customers
        customer_age_days = (END_DATE - customer_created_at).days
        max_possible_orders = min(10, max(1, int(customer_age_days / 30)))
        num_orders = random.choices(
            population=range(max_possible_orders + 1),
            weights=[0.15] + [0.85 / max_possible_orders] * max_possible_orders,
            k=1
        )[0]
        
        for _ in range(num_orders):
            # Generate order date (after customer creation, with seasonal patterns)
            # More orders during November-December (holidays) and summer
            while True:
                order_date = random_date(customer_created_at, END_DATE)
                month = order_date.month
                
                # Apply seasonal weights
                if month in [11, 12]:  # Holiday season
                    seasonal_factor = 2.0
                elif month in [6, 7, 8]:  # Summer
                    seasonal_factor = 1.5
                else:
                    seasonal_factor = 1.0
                
                # Accept with probability based on seasonal factor
                if random.random() < (seasonal_factor / 2.0):
                    break
            
            # Select shipping and billing addresses
            shipping_address_id = None
            for addr in shipping_addresses:
                if addr[1] == customer_id:
                    shipping_address_id = addr[0]
                    break
            
            billing_address_id = None
            for addr in billing_addresses:
                if addr[1] == customer_id:
                    billing_address_id = addr[0]
                    break
            
            # If no addresses found, skip this order
            if not shipping_address_id or not billing_address_id:
                continue
            
            # Select shipping and payment methods
            shipping_method = random.choice(shipping_methods)
            shipping_method_id = shipping_method[0]
            shipping_amount = shipping_method[1]
            
            payment_method_id = random.choice(payment_methods)[0]
            
            # Determine order status based on date and randomness
            days_since_order = (END_DATE - order_date).days
            
            if days_since_order < 1:
                status = random.choices(["pending", "processing"], weights=[0.7, 0.3], k=1)[0]
            elif days_since_order < 3:
                status = random.choices(["pending", "processing", "shipped"], weights=[0.2, 0.4, 0.4], k=1)[0]
            elif days_since_order < 7:
                status = random.choices(["processing", "shipped", "delivered"], weights=[0.1, 0.4, 0.5], k=1)[0]
            else:
                status = random.choices(order_statuses, weights=status_weights, k=1)[0]
            
            # Generate order items
            num_items = random.randint(1, 5)
            selected_products = random.sample(products, min(num_items, len(products)))
            
            total_amount = shipping_amount
            discount_amount = 0
            tax_amount = 0
            
            # Create order
            cursor.execute(
                """
                INSERT INTO orders (
                    customer_id, order_date, status, total_amount, shipping_amount,
                    tax_amount, discount_amount, payment_method, shipping_method,
                    shipping_address_id, billing_address_id, notes,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
                """,
                (
                    customer_id,
                    order_date,
                    status,
                    0,  # This will be updated after calculating items
                    shipping_amount,
                    0,  # Tax will be calculated
                    0,  # Discount will be calculated
                    f"pm_{payment_method_id}",  # Prefix to make it look like a real payment method ID
                    f"sm_{shipping_method_id}",  # Prefix to make it look like a real shipping method ID
                    shipping_address_id,
                    billing_address_id,
                    fake.sentence() if random.random() < 0.2 else None,  # 20% chance of having notes
                    order_date,
                    order_date + timedelta(minutes=random.randint(5, 60))
                )
            )
            
            order_id = cursor.fetchone()[0]
            orders_created += 1
            
            # Create order items
            for product in selected_products:
                product_id, product_price, product_discount = product
                
                # Generate quantity
                quantity = random.randint(1, 3)
                
                # Calculate price with discount
                unit_price = product_price
                discount_percent = product_discount
                
                # Calculate item totals
                item_total = unit_price * quantity
                item_discount = (unit_price * quantity) * (discount_percent / 100)
                
                # Update order totals
                total_amount += item_total
                discount_amount += item_discount
                
                # Determine item status based on order status
                if status in ["pending", "processing"]:
                    item_status = "processing"
                elif status == "shipped":
                    item_status = "shipped"
                elif status == "delivered":
                    item_status = "delivered"
                elif status == "canceled":
                    item_status = "canceled"
                else:  # returned
                    item_status = random.choice(["delivered", "returned"])
                
                # Insert order item
                cursor.execute(
                    """
                    INSERT INTO order_items (
                        order_id, product_id, quantity, unit_price,
                        discount_percent, is_gift, status, created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        order_id,
                        product_id,
                        quantity,
                        unit_price,
                        discount_percent,
                        random.random() < 0.05,  # 5% chance of being a gift
                        item_status,
                        order_date
                    )
                )
                
                order_items_created += 1
            
            # Calculate tax (after all items added)
            tax_amount = (total_amount - discount_amount) * 0.08  # 8% tax rate
            
            # Update order with correct totals
            cursor.execute(
                """
                UPDATE orders
                SET total_amount = %s, tax_amount = %s, discount_amount = %s
                WHERE id = %s;
                """,
                (
                    round(total_amount, 2),
                    round(tax_amount, 2),
                    round(discount_amount, 2),
                    order_id
                )
            )
    
    conn.commit()
    print(f"Generated {orders_created} orders with {order_items_created} order items")

def generate_product_reviews(conn):
    """Generate product reviews"""
    cursor = conn.cursor()
    
    # Get order items with delivered status to generate reviews
    cursor.execute("""
        SELECT oi.id, oi.product_id, o.customer_id, o.order_date
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.status = 'delivered'
    """)
    delivered_items = cursor.fetchall()
    
    # Review status probabilities
    review_statuses = ["approved", "pending", "rejected"]
    status_weights = [0.9, 0.08, 0.02]  # Probabilities
    
    # Create reviews for about 30% of delivered items
    reviews_created = 0
    
    for item in delivered_items:
        if random.random() < 0.3:  # 30% chance of review
            item_id, product_id, customer_id, order_date = item
            
            # Review date is between order date and 30 days after
            max_review_date = order_date + timedelta(days=30)
            # Cap at END_DATE
            max_review_date = min(max_review_date, END_DATE)
            
            review_date = random_date(order_date + timedelta(days=1), max_review_date)
            
            # Generate rating weighted toward positive (people more likely to review good experiences)
            rating_weights = [0.05, 0.1, 0.15, 0.3, 0.4]  # More 5-star ratings
            rating = random.choices(range(1, 6), weights=rating_weights, k=1)[0]
            
            # Generate review text based on rating
            if rating >= 4:
                review_text = fake.paragraph(nb_sentences=random.randint(1, 3))
            elif rating == 3:
                review_text = fake.paragraph(nb_sentences=random.randint(1, 2))
            else:
                review_text = fake.sentence()
            
            # Generate helpfulness votes (higher ratings tend to get more votes)
            helpfulness_votes = 0
            if rating >= 4:
                helpfulness_votes = random.randint(0, 20)
            elif rating == 3:
                helpfulness_votes = random.randint(0, 10)
            else:
                helpfulness_votes = random.randint(0, 5)
            
            # Determine review status
            review_status = random.choices(review_statuses, weights=status_weights, k=1)[0]
            
            cursor.execute(
                """
                INSERT INTO product_reviews (
                    product_id, customer_id, rating, review_text,
                    review_date, helpfulness_votes, verified_purchase,
                    review_status, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    product_id,
                    customer_id,
                    rating,
                    review_text,
                    review_date,
                    helpfulness_votes,
                    True,  # All reviews are from verified purchases
                    review_status,
                    review_date
                )
            )
            
            reviews_created += 1
    
    conn.commit()
    print(f"Generated {reviews_created} product reviews")

def generate_website_traffic(conn):
    """Generate website traffic data for the past year"""
    cursor = conn.cursor()
    
    # Page paths
    page_paths = [
        "/", "/products", "/categories", "/about", "/contact",
        "/cart", "/checkout", "/account", "/orders", "/wishlist",
        "/products/electronics", "/products/clothing", "/products/home-kitchen",
        "/products/books", "/products/sports-outdoors", "/blog", "/faq"
    ]
    
    # Generate product page paths
    cursor.execute("SELECT id, name FROM products LIMIT 20")
    products = cursor.fetchall()
    for product in products:
        page_paths.append(f"/products/{product[0]}")
    
    # Referrers
    referrers = [
        "google.com", "facebook.com", "instagram.com", "twitter.com",
        "pinterest.com", "bing.com", "yahoo.com", "linkedin.com",
        "reddit.com", "youtube.com", "(direct)", "email"
    ]
    
    # Devices
    devices = ["desktop", "mobile", "tablet"]
    device_weights = [0.45, 0.45, 0.1]
    
    # Browsers
    browsers = ["Chrome", "Safari", "Firefox", "Edge", "Opera"]
    browser_weights = [0.6, 0.2, 0.1, 0.08, 0.02]
    
    # Create traffic patterns - more traffic on weekends and holidays
    start_date = END_DATE - timedelta(days=NUM_WEBSITE_TRAFFIC_DAYS)
    current_date = start_date
    
    traffic_data = []
    
    while current_date <= END_DATE:
        # Determine number of records for this day
        is_weekend = current_date.weekday() >= 5
        is_november_december = current_date.month in [11, 12]
        
        # Base daily records
        num_daily_records = random.randint(5, 20)
        
        # More traffic on weekends
        if is_weekend:
            num_daily_records += random.randint(3, 8)
            
        # More traffic during holiday season
        if is_november_december:
            num_daily_records += random.randint(5, 10)
        
        # Generate traffic records for each path
        for _ in range(num_daily_records):
            page_path = random.choice(page_paths)
            
            # Home page gets more traffic
            if random.random() < 0.3:
                page_path = "/"
            
            # Device type
            device_type = random.choices(devices, weights=device_weights, k=1)[0]
            
            # Browser
            browser = random.choices(browsers, weights=browser_weights, k=1)[0]
            
            # Referrer - mostly direct and Google
            referrer = random.choices(
                referrers, 
                weights=[0.4, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05, 0.02, 0.03, 0.05, 0.05, 0.05],
                k=1
            )[0]
            
            # Geography
            # US cities
            cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", 
                      "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Seattle"]
            city = random.choice(cities)
            
            # Traffic metrics
            sessions = random.randint(50, 500)
            unique_visitors = int(sessions * random.uniform(0.7, 0.9))  # 70-90% of sessions
            page_views = int(sessions * random.uniform(1.5, 3.0))  # 1.5-3x page views per session
            
            avg_time = round(random.uniform(30, 300), 2)  # 30s to 5min
            bounce_rate = round(random.uniform(0.2, 0.6), 2)  # 20-60%
            
            # Add to batch
            traffic_data.append((
                current_date,
                page_path,
                referrer,
                device_type,
                browser,
                "USA",
                city,
                sessions,
                unique_visitors,
                page_views,
                avg_time,
                bounce_rate,
                current_date
            ))
            
            # If batch size reaches 1000, insert batch
            if len(traffic_data) >= 1000:
                execute_values(
                    cursor,
                    """
                    INSERT INTO website_traffic (
                        date, page_path, referrer, device_type, browser,
                        country, city, sessions, unique_visitors, page_views,
                        avg_time_on_page, bounce_rate, created_at
                    )
                    VALUES %s;
                    """,
                    traffic_data
                )
                
                conn.commit()
                traffic_data = []
        
        # Move to next day
        current_date += timedelta(days=1)
    
    # Insert any remaining data
    if traffic_data:
        execute_values(
            cursor,
            """
            INSERT INTO website_traffic (
                date, page_path, referrer, device_type, browser,
                country, city, sessions, unique_visitors, page_views,
                avg_time_on_page, bounce_rate, created_at
            )
            VALUES %s;
            """,
            traffic_data
        )
        
        conn.commit()
    
    # Get count of traffic records
    cursor.execute("SELECT COUNT(*) FROM website_traffic")
    traffic_count = cursor.fetchone()[0]
    print(f"Generated {traffic_count} website traffic records")

def generate_promotions(conn):
    """Generate promotions"""
    cursor = conn.cursor()
    
    promotions = [
        {"name": "Welcome Discount", "type": "percentage", "value": 10, "code": "WELCOME10"},
        {"name": "Summer Sale", "type": "percentage", "value": 15, "code": "SUMMER15"},
        {"name": "Black Friday", "type": "percentage", "value": 25, "code": "BLACKFRI25"},
        {"name": "Holiday Special", "type": "percentage", "value": 20, "code": "HOLIDAY20"},
        {"name": "Free Shipping", "type": "fixed_amount", "value": 0, "code": "FREESHIP"},
        {"name": "$10 Off", "type": "fixed_amount", "value": 10, "code": "10OFF"},
        {"name": "Loyalty Reward", "type": "percentage", "value": 15, "code": "LOYAL15"},
        {"name": "Newsletter Signup", "type": "percentage", "value": 5, "code": "NEWS5"},
        {"name": "Flash Sale", "type": "percentage", "value": 30, "code": "FLASH30"},
        {"name": "Birthday Discount", "type": "percentage", "value": 20, "code": "BDAY20"}
    ]
    
    for promotion in promotions:
        # Generate start and end dates
        if promotion["name"] == "Summer Sale":
            start_date = datetime(2023, 6, 1)
            end_date = datetime(2023, 8, 31)
        elif promotion["name"] == "Black Friday":
            start_date = datetime(2023, 11, 20)
            end_date = datetime(2023, 11, 30)
        elif promotion["name"] == "Holiday Special":
            start_date = datetime(2023, 12, 1)
            end_date = datetime(2023, 12, 31)
        else:
            # Random dates for other promotions
            start_date = random_date(START_DATE, END_DATE - timedelta(days=30))
            end_date = start_date + timedelta(days=random.randint(7, 90))
        
        cursor.execute(
            """
            INSERT INTO promotions (
                name, description, discount_type, discount_value,
                start_date, end_date, minimum_order_amount, coupon_code,
                usage_limit, usage_count, is_active, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """,
            (
                promotion["name"],
                fake.paragraph(nb_sentences=1),
                promotion["type"],
                promotion["value"],
                start_date,
                end_date,
                random.choice([None, 25, 50, 100]),  # Minimum order amount
                promotion["code"],
                random.randint(100, 1000),  # Usage limit
                random.randint(0, 100),  # Usage count
                start_date <= END_DATE <= end_date,  # Active if current date is in range
                start_date - timedelta(days=random.randint(1, 14)),  # Created before start
                start_date - timedelta(days=random.randint(0, 7))  # Updated after creation
            )
        )
    
    conn.commit()
    print(f"Generated {len(promotions)} promotions")

def generate_sales_targets(conn):
    """Generate sales targets by category and month"""
    cursor = conn.cursor()
    
    # Get categories
    cursor.execute("SELECT id FROM categories")
    categories = [row[0] for row in cursor.fetchall()]
    
    targets_created = 0
    
    # Generate targets for each year and month
    for year in range(START_DATE.year, END_DATE.year + 1):
        for month in range(1, 13):
            # Skip future months
            if year == END_DATE.year and month > END_DATE.month:
                continue
                
            # Generate a target for each category
            for category_id in categories:
                # Base monthly target
                base_target = random.uniform(10000, 100000)
                
                # Adjust for seasonality
                if month in [11, 12]:  # Holiday season
                    seasonal_factor = 1.5
                elif month in [6, 7, 8]:  # Summer
                    seasonal_factor = 1.2
                else:
                    seasonal_factor = 1.0
                
                # Adjust for growth over time
                years_from_start = year - START_DATE.year
                growth_factor = 1.0 + (years_from_start * 0.1)  # 10% growth per year
                
                # Calculate final target
                target_amount = round(base_target * seasonal_factor * growth_factor, 2)
                
                cursor.execute(
                    """
                    INSERT INTO sales_targets (
                        year, month, category_id, target_amount, created_at, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s);
                    """,
                    (
                        year,
                        month,
                        category_id,
                        target_amount,
                        datetime(year, month, 1) - timedelta(days=15),  # Created ~15 days before month starts
                        datetime(year, month, 1) - timedelta(days=10)  # Updated after creation
                    )
                )
                
                targets_created += 1
    
    conn.commit()
    print(f"Generated {targets_created} sales targets")

def main():
    """Main function to populate the database"""
    try:
        # Connect to database
        conn = connect_to_db()
        
        # Clear all existing data
        clear_all_tables(conn)
        
        # Reset sequences
        reset_sequences(conn)
        
        # Generate data in appropriate order
        print("Starting data generation...")
        
        generate_categories(conn)
        generate_brands(conn)
        generate_products(conn)
        generate_addresses(conn)
        generate_customers(conn)
        generate_warehouses(conn)
        generate_product_inventory(conn)
        generate_marketing_campaigns(conn)
        generate_campaign_performance(conn)
        generate_shipping_methods(conn)
        generate_payment_methods(conn)
        
        # Generate segments and tags - returning IDs for relationships
        segment_ids = generate_customer_segments(conn)
        tag_ids = generate_product_tags(conn)
        
        # Generate relationships
        generate_product_tag_relationships(conn, tag_ids)
        generate_customer_segment_memberships(conn, segment_ids)
        
        # Generate orders and reviews
        generate_orders_and_items(conn)
        generate_product_reviews(conn)
        
        # Generate website traffic
        generate_website_traffic(conn)
        
        # Generate promotions and sales targets
        generate_promotions(conn)
        generate_sales_targets(conn)
        
        print("Data generation complete!")
        
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
            print("Database connection closed")

if __name__ == "__main__":
    main()