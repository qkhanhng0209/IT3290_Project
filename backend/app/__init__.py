from flask import Flask
from app.config import Config
from flask_cors import CORS

from app.routes.auth import auth_bp
from app.routes.books import books_bp
from app.routes.members import members_bp
from app.routes.borrowing import borrowing_bp
from app.routes.returns import returns_bp
from app.routes.violations import violations_bp
from app.routes.notifications import notifications_bp
from app.routes.reports import reports_bp

def create_app():
    app = Flask(__name__)
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

    return app