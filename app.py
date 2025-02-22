from flask import Flask, request, jsonify, render_template, session
from flask_mysqldb import MySQL
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests
bcrypt = Bcrypt(app)

# 🔹 Configure MySQL Connection
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'flask_user'  # Replace with actual MySQL user
app.config['MYSQL_PASSWORD'] = 'your_password'  # Replace with actual MySQL password
app.config['MYSQL_DB'] = 'agrisahyak'  # Your database name
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'  # Fetch results as dictionaries

# 🔹 Secret Key for Sessions
app.config['SECRET_KEY'] = os.urandom(24)  # Randomly generate a secret key

# 🔹 Initialize MySQL
mysql = MySQL(app)

# -------------------------------
# ✅ HOME ROUTE (TEST CONNECTION)
# -------------------------------
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Flask is connected to MySQL"}), 200

# -------------------------------
# ✅ FARMER REGISTRATION
# -------------------------------
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO farmers (name, email, password) VALUES (%s, %s, %s)", 
                    (name, email, hashed_password))
        mysql.connection.commit()
        cur.close()

        return jsonify({'message': 'Farmer registered successfully'}), 201

    except Exception as e:
        mysql.connection.rollback()  
        return jsonify({'error': str(e)}), 500

# -------------------------------
# ✅ FARMER LOGIN
# -------------------------------
@app.route('/login', methods=['POST'])
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Both email and password are required'}), 400

        cur = mysql.connection.cursor()
        cur.execute("SELECT id, name, password FROM farmers WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()

        if user and bcrypt.check_password_hash(user['password'], password):
            session['farmer_id'] = user['id']
            session['farmer_name'] = user['name']  # Store farmer's name in session
            return jsonify({'message': 'Login successful', 'farmer_id': user['id'], 'farmer_name': user['name']}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# -------------------------------
# ✅ SAVE CROP INFORMATION
@app.route('/save_crop', methods=['POST'])
def save_crop():
    
    try:
        if 'farmer_id' not in session:
            print("🔴 Farmer is not logged in!")  # Debugging
            return jsonify({'error': 'Unauthorized! Please login first'}), 401

        crop_name = request.form.get('crop_name')
        plantation_date = request.form.get('plantation_date')
        harvest_date = request.form.get('harvest_date')

        print(f"🟢 Received Crop Data: {crop_name}, {plantation_date}, {harvest_date}")  # Debugging

        if not crop_name or not plantation_date or not harvest_date:
            print("❌ Missing Fields!")
            return jsonify({'error': 'All fields are required'}), 400

        farmer_id = session.get('farmer_id')  # Get farmer_id safely
        print(f"🟢 Farmer ID from session: {farmer_id}")  # Debugging

        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO crops (farmer_id, crop_name, plantation_date, harvest_date) 
            VALUES (%s, %s, %s, %s)
        """, (farmer_id, crop_name, plantation_date, harvest_date))

        mysql.connection.commit()
        cur.close()

        print("✅ Crop saved successfully!")  # Debugging
        return jsonify({"message": "Crop details saved successfully!"}), 201

    except Exception as e:
        mysql.connection.rollback()
        print("❌ Error:", str(e))  # Print detailed error
        return jsonify({'error': str(e)}), 500

# -------------------------------
# ✅ FARMER LOGOUT
# -------------------------------
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('farmer_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200

# -------------------------------
# ✅ HANDLE ERRORS
# -------------------------------
@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method Not Allowed, use the correct HTTP method'}), 405

# -------------------------------
# ✅ RUN FLASK SERVER
# -------------------------------
if __name__ == '__main__':
    try:
        app.run(debug=True)
    except Exception as e:
        print("❌ Flask server failed:", str(e))
