from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

from config import Config

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

db_session = scoped_session(sessionmaker(bind=engine))


def init_db():
    from models import Base
    import models.db_operation

    Base.metadata.create_all(engine)