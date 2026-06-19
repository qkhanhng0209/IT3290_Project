from flask import Flask, send_from_directory
from app.config import Config
from flask_cors import CORS
import os

from app.routes.auth import auth_bp
from app.routes.books import books_bp
from app.routes.members import members_bp
from app.routes.borrowing import borrowing_bp
from app.routes.returns import returns_bp
from app.routes.violations import violations_bp
from app.routes.notifications import notifications_bp
from app.routes.reports import reports_bp
from app.routes.health import health_bp

def create_app():
    app = Flask(__name__)
    app.json.ensure_ascii = False
    app.secret_key = Config.SECRET_KEY
    CORS(app)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(books_bp)
    app.register_blueprint(members_bp)
    app.register_blueprint(borrowing_bp)
    app.register_blueprint(returns_bp)
    app.register_blueprint(violations_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(health_bp)
    
    frontend_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
    )
    
    @app.route("/")
    def index():
        return send_from_directory(frontend_dir, "index.html")
    
    @app.route("/<path:filename>")
    def serve_frontend(filename):
        return send_from_directory(frontend_dir, filename)

    return app