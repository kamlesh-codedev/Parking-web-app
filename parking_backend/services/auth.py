import bcrypt
from database import db_session
from models import Users


# -------------------------
# Password Functions
# -------------------------

def seed_user():
    user = Users(
        username="admin",
        password=hash_text("admin123"),
        security_question="What is your favourite color?",
        security_answer=hash_text("Blue")
    )

    db_session.add(user)
    try:
        db_session.commit()
    except Exception:
        db_session.rollback()


def hash_text(text: str) -> str:
    """
    Hash any text (password or security answer).
    """
    return bcrypt.hashpw(
        text.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_text(text: str, hashed_text: str) -> bool:
    """
    Verify plain text against a stored hash.
    """
    return bcrypt.checkpw(
        text.encode("utf-8"),
        hashed_text.encode("utf-8")
    )


# -------------------------
# Create User
# -------------------------

def create_user(
    username: str,
    password: str,
    security_question: str,
    security_answer: str
):
    """
    Create a new user.
    """

    if db_session.query(Users).filter_by(username=username).first():
        raise ValueError("Username already exists.")

    user = Users(
        username=username,
        password=hash_text(password),
        security_question=security_question,
        security_answer=hash_text(security_answer)
    )

    db_session.add(user)
    db_session.commit()

    return user


# -------------------------
# Login
# -------------------------

def authenticate_user(username: str, password: str) -> bool:

    user = db_session.query(Users).filter_by(username=username).first()

    if not user:
        return False

    return verify_text(password, user.password)


# -------------------------
# Get Security Question
# -------------------------

def get_security_question(username: str):

    user = db_session.query(Users).filter_by(username=username).first()

    if not user:
        return None

    return user.security_question


# -------------------------
# Verify Security Answer
# -------------------------

def verify_security_answer(username: str, answer: str) -> bool:

    user = db_session.query(Users).filter_by(username=username).first()

    if not user:
        return False

    return verify_text(answer, user.security_answer)


# -------------------------
# Reset Password
# -------------------------

def reset_password(username: str, new_password: str) -> bool:

    user = db_session.query(Users).filter_by(username=username).first()

    if not user:
        return False

    user.password = hash_text(new_password)

    db_session.commit()

    return True

if __name__ == "__main__":
    seed_user()

# -------------------------
# Change Password
# -------------------------

# def change_password(
#     username: str,
#     old_password: str,
#     new_password: str
# ) -> bool:

#     user = db_session.query(Users).filter_by(username=username).first()

#     if not user:
#         return False

#     if not verify_text(old_password, user.password):
#         return False

#     user.password = hash_text(new_password)

#     db_session.commit()

#     return True