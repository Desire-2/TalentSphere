#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from src.models.user import db, User

app = Flask(__name__)
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    admin_users = User.query.filter_by(role='admin').all()
    print('Admin users found:')
    for user in admin_users:
        print(f'ID: {user.id}, Email: {user.email}, Active: {user.is_active}')
        print(f'Last login: {user.last_login}')
