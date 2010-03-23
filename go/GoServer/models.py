from django.db import models
from django.forms import ModelForm

# so we can have user foreign keys
from django.contrib.auth.models import User

class Game(models.Model):
    import datetime
     
    StartDate = models.DateTimeField('Game Start Date', default=datetime.datetime.now)

    BoardSize = models.CharField(max_length=10, choices=(('19x19','19 x 19'),
                                                         ('13x13','13 x 13'),
                                                         ('9x9','9 x 9')), default='19x19')

    
    def __unicode__(self):
        return u'Game of size %s ' % self.BoardSize

class GameForm(ModelForm):
    class Meta:
        model = Game
        exclude = ('StartDate')

class GameParticipant(models.Model):
    import datetime

    Game = models.ForeignKey(Game)
    Participant = models.ForeignKey(User)
    JoinDate = models.DateTimeField('Participant Join Date', default=datetime.datetime.now)
    LeaveDate = models.DateTimeField('Participant Leave Date', default=datetime.datetime.now)

    Winner = models.BooleanField('Winner')
    
    def __unicode__(self):
        return 'GameParticipant Object'

class UserProfile(models.Model):
    user = models.OneToOneField(User)
    activation_key = models.CharField(max_length=40)
    key_expires = models.DateTimeField()


# class GameTree(models.Model):
#     pass

# class Moves(models.Model):
#     Game = models.ForeignKey(Game)
#     Player = models.ForeignKey(GameParticipant)
#    MoveNumber = 
