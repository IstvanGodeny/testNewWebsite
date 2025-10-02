import smtplib
import os
from flask import Flask, render_template, request, redirect, url_for
from flask_bootstrap import Bootstrap5, Bootstrap4
# from flask_ckeditor import CKEditor, CKEditorField
from flask_wtf import FlaskForm
from wtforms import TextAreaField
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String, Boolean
from wtforms import StringField, SubmitField, TextAreaField, RadioField
from wtforms.validators import DataRequired, Email, InputRequired
from datetime import datetime



### Email details
WEB_EMAIL = os.environ.get("WEB_EMAIL_ADDRESS")
WEB_EMAIL_PASSWORD = os.environ.get("WEB_EMAIL_PASSWORD")
SMTP_ADDRESS = os.environ.get("WEB_EMAIL_SMTP_ADDRESS")


## Create the Flask app
app = Flask(__name__)

## Automatic year update in footer
year = datetime.now().year

## Initial the Bootstrap
bootstrap = Bootstrap5(app)


## Initial the Flask Form
# A secret key is required to use CSRF with Flask Form
app.config['SECRET_KEY'] = os.environ.get("FLASK_FORM_SECRET_KEY")

## CKEditor init
# ckeditor = CKEditor(app)


## Forms
# Send message
class SendMessageForm(FlaskForm):
    name = StringField(label="Your name: ", validators=[DataRequired()])
    email = StringField(label="Your email: ", validators=[DataRequired(), Email()])
    message = TextAreaField(label="Your message:", validators=[DataRequired()])
    submit = SubmitField(label="Send message")

# Add project
class ProjectForm(FlaskForm):
    title = StringField(label="Title: ", validators=[DataRequired()])
    favorite = RadioField(label="Favorite: ", choices=[(1, "Favorite"), (0, "Not Favorite")], default=0, validators=[InputRequired(message="Favorite or not?")])
    github = StringField(label="GitHub link: ")
    icon = StringField(label="Icon: ")
    screenshot = StringField(label="Screenshot: ")
    video = StringField(label="Video: ")
    text = StringField(label="Subtitle: ")
    # description = CKEditorField(label="Description: ", render_kw={"id": "description"})
    description = TextAreaField(label="Description: ", render_kw={"id": "description"})
    submit = SubmitField(label="Submit Project")




## Database
# Create the database
class Base(DeclarativeBase):
    pass

SQLALCHEMY_DATABASE_URI = os.environ.get("SQLALCHEMY_DATABASE_URI")
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
db = SQLAlchemy(model_class=Base)
db.init_app(app)

# Create the table -- Initialization
class Projects(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=True)
    favorite: Mapped[bool] = mapped_column(Boolean, nullable=True)
    github: Mapped[str] = mapped_column(String, nullable=False)
    icon: Mapped[str] = mapped_column(String, nullable=False)
    screenshot: Mapped[str] = mapped_column(String, nullable=False)
    video: Mapped[str] = mapped_column(String, nullable=False)
    text: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)

    # The objects identify by the id
    def __repr__(self):
        return f"<Projects{self.id}>"

    # Maybe create the dictionary from the database to RESTFull API
    def to_dict(self):
        dictionary = {}
        for column in self.__table__.columns:
            dictionary[column.id] = getattr(self, column.id)
        return dictionary
# Create the table after initialization
with app.app_context():
    db.create_all()

global all_projects

## Level 1 routes
# Homepage route
@app.route("/", methods=["GET", "POST"])
@app.route("/<page>")
def home(page="#home"):
    result = db.session.execute(db.select(Projects).order_by(Projects.id))
    global all_projects
    all_projects = result.scalars().all()

    return render_template("Level1/index.html", active_page=page, year=year, all_projects=all_projects)

# Add a project route
@app.route("/add_project", methods=["GET", "POST"])
@app.route("/<page>")
def add_project(page="add_project"):
    # Create the form for the new project
    new_project = ProjectForm()
    if new_project.validate_on_submit():
        title = new_project.title.data
        favorite = int(new_project.favorite.data)
        github = new_project.github.data
        icon = new_project.icon.data
        screenshot = new_project.screenshot.data
        video = new_project.video.data
        text = new_project.text.data
        description = new_project.description.data

        new_project_record = Projects(
            title = title,
            name = title.lower().replace(" ", "_"),
            favorite = favorite,
            github = github,
            icon = icon,
            screenshot = screenshot,
            video = video,
            text = text,
            description = description
        )

        db.session.add(new_project_record)
        db.session.commit()
        return redirect(url_for('home'))

    return render_template("Level1/make_project.html", active_page=page, project_form=new_project, year=year)

# Edit project route
@app.route("/edit_project")
def list_project():
    result = db.session.execute(db.select(Projects).order_by(Projects.id))
    all_projects_list = result.scalars().all()
    return render_template(
        "Level1/list_project.html",
        all_projects=all_projects_list,
        year=year
    )

@app.route("/edit_project/<int:project_id>/<string:project_name>", methods=["GET", "POST"])
def edit_project(project_id, project_name):
    project_to_edit = db.get_or_404(Projects, project_id)
    edit_form = ProjectForm(
        title = project_to_edit.title,
        favorite = int(project_to_edit.favorite),
        github = project_to_edit.github,
        icon = project_to_edit.icon,
        screenshot = project_to_edit.screenshot,
        video = project_to_edit.video,
        text = project_to_edit.text,
        description = project_to_edit.description,
    )
    if edit_form.validate_on_submit():
        project_to_edit.title = edit_form.title.data
        project_to_edit.favorite = int(edit_form.favorite.data)
        project_to_edit.github = edit_form.github.data
        project_to_edit.icon = edit_form.icon.data
        project_to_edit.screenshot = edit_form.screenshot.data
        project_to_edit.video = edit_form.video.data
        project_to_edit.text = edit_form.text.data
        project_to_edit.description = edit_form.description.data
        db.session.commit()
        return redirect(url_for('home'))
    return render_template(
        "Level1/make_project.html",
        active_page=project_id,
        project_form=edit_form,
        year=year
    )

# Delete project
@app.route("/edit_project/<int:project_id>")
def delete_project(project_id):
    project_to_delete = db.get_or_404(Projects, project_id)
    db.session.delete(project_to_delete)
    db.session.commit()
    return redirect(url_for('list_project'))



## Level 2 routes
# About route
@app.route("/about")
@app.route("/<page>")
def about(page="about"):
    return render_template("Level2/about.html", active_page=page, year=year)

# Contact Me route
@app.route("/contact_me", methods=["GET", "POST"])
@app.route("/<page>")
def contact(page="contact_me"):

    ## Create the form here
    send_form = SendMessageForm()
    if send_form.validate_on_submit():
        sender_name = send_form.name.data
        sender_email = send_form.email.data
        sender_message = send_form.message.data

        with smtplib.SMTP(SMTP_ADDRESS) as connection:
            connection.starttls()
            connection.login(user=WEB_EMAIL,
                             password=WEB_EMAIL_PASSWORD)
            connection.sendmail(from_addr=WEB_EMAIL,
                                to_addrs=os.environ.get("MY_EMAIL"),
                                msg=f"Subject: Message from {sender_name} via website contact form.\n\n"
                                    f"Message received from {sender_name} with {sender_email}\n"
                                    f"\nThe message is:\n"
                                    f"\n{sender_message}")

            with smtplib.SMTP(SMTP_ADDRESS) as connection_receipt:
                connection_receipt.starttls()
                connection_receipt.login(user=WEB_EMAIL,
                                        password=WEB_EMAIL_PASSWORD)
                connection_receipt.sendmail(from_addr=WEB_EMAIL,
                                    to_addrs=sender_email,
                                    msg=f"Subject: The message has been sent to Istvan.\n\n"
                                        f"\nThe message you sent:\n"
                                        f"\n{sender_message}")

        send_form.name.data = ""
        send_form.email.data = ""
        send_form.message.data = (f"The message has been sent\n"
                                  f"You will get a copy of your message shortly.")

    return render_template("Level2/contact.html", active_page=page, year=year, form=send_form)

# Project route
@app.route("/project/<project_name>", methods=["GET", "POST"])
#@app.route("/project/<page>")
def project(project_name):
    return render_template("Level2/project.html", active_page=project_name, all_projects=all_projects, year=year)


## Sliding window route
# Project fragment
@app.route("/project/<project_name>/fragment")
def project_fragment(project_name):
    return render_template(
        "Level3/project_fragment.html",
        active_page=project_name,
        all_projects=all_projects,
        year=year
    )

# About fragment
@app.route("/about/fragment")
def about_fragment():
    return render_template("Level3/about_fragment.html")

# Projects fragment
@app.route("/projects/fragment")
def projects_fragment():
    return render_template("Level3/projects_fragment.html", all_projects=all_projects)

# Project delete confirm fragment
@app.route("/delete_confirm/<int:project_id>/fragment", methods=["GET", "POST"])
def delete_confirm_project(project_id):
    return render_template(
        "Level3/delete_confirm_fragment.html",
        all_projects=all_projects,
        project_id=project_id
    )

## Run the server with debug mode
if __name__ == "__main__":
    app.run(debug=True)
