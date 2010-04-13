/**
 * EidoGo -- Web-based SGF Editor
 * Copyright (c) 2007, Justin Kramer <jkkramer@gmail.com>
 * Code licensed under AGPLv3:
 * http://www.fsf.org/licensing/licenses/agpl-3.0.html
 */

/**
 * @class Applies rules (capturing, ko, etc) to a board.
 */
eidogo.Rules = function(board, cfgRules) {
    this.init(board, cfgRules);
};
eidogo.Rules.prototype = {
    /**
     * @constructor
     * @param {eidogo.Board} board The board to apply rules to
     */
    init: function(board, cfgRules) {
        this.board = board;
        this.cfgRules = cfgRules;
        this.pendingCaptures = [];
        this.koImmune = false;
    },
    /**
     * Called to see whether a stone may be placed at a given point
    **/
    check: function(pt, colorLetter) {
        // already occupied?
        if (this.board.getStone(pt) != this.board.EMPTY) {
            return false;
        }

        var color = ( colorLetter == 'B' ? this.board.BLACK : this.board.WHITE );
        
        // simulate the stone being added .. this is used for both suicide and ko checks, will be undone later
        this.board.addStone(pt, color);
        
        // make a note of the opposite color 
        other_color = color * -1;

        violation = false;
        
        ///////////////
        // check for suicide? (allowed in certain rulesets)
        if(!this.cfgRules.allowSuicide) { 
            
            // first make sure this isnt actually a capturing move
            checkPoints = Array({x: pt.x-1, y: pt.y},
                                {x: pt.x+1, y: pt.y},
                                {x: pt.x, y: pt.y-1},
                                {x: pt.x, y: pt.y+1});
            
            var capturing = false;

            check_capture_loop:
            for(var i=0;i<checkPoints.length;i++) { 
                if(this.board.getStone(checkPoints[i]) == other_color) { 
                    groupPoints = this.board.findGroupPoints( checkPoints[i] );
                    liberty_count = 0;
                    for(j=0;j<groupPoints.length;j++) { 
                        liberty_count += this.board.getStoneLiberties(groupPoints[j]).length;
                    }
                    if(liberty_count == 0) { 
                        // a-ha! so this is a capturing move.  its not a suicide
                        capturing = true;
                        break check_capture_loop;
                    }
                }
            }
            
            // we aren't capturing.. proceed checking if this is a suicide
            if(!capturing) { 
                groupPoints = this.board.findGroupPoints( pt );
                liberty_count = 0;
                for(i=0;i<groupPoints.length;i++) { 
                    liberty_count += this.board.getStoneLiberties(groupPoints[i]).length;
                }
                if(liberty_count == 0) { 
                    violation = 'Suicide';
                }
            }
        }
        
        if(this.cfgRules.koRule == 'simple') { 
            
            // if a koImmune stone was set in a previous capture
            if(this.koImmune) { 
                groupPoints = this.board.findGroupPoints( this.koImmune );
                
                for(i=0;i<groupPoints.length;i++) 
                    liberty_count += this.board.getStoneLiberties(groupPoints[i]).length;
                
                if(liberty_count == 0) { 
                    violation = 'Ko';
                }
            }

            // this koImmune is no longer a concern
            if(!violation) 
                this.koImmune = false;
            
        } else if(this.cfgRules.koRule == 'positional_superko') { 
            // TODO
            violation = 'Positional Superko Unimplemented';
        } else if(this.cfgRules.koRule == 'situational_superko') { 
            // TODO
            violation = 'Situational Superko Unimplemented';
        }
          
        // return the board to its true position
        this.board.addStone(pt, this.board.EMPTY);

        if(violation) { 
            alert("Rule violation: "+violation);
            return false;
        }
        
        return true;
    },
    /**
     * Apply rules to the current game (perform any captures, etc)
    **/
    apply: function(pt, color) {
        this.doCaptures(pt, color);
    },
    /**
     * Thanks to Arno Hollosi for the capturing algorithm
     */
    doCaptures: function(pt, color) {
        var captures = 0;

        // if only one capture was produced, mark pt as immuneByKo
        
        checkPoints = Array({x: pt.x-1, y: pt.y},
                            {x: pt.x+1, y: pt.y},
                            {x: pt.x, y: pt.y-1},
                            {x: pt.x, y: pt.y+1});

        potentialKo = Array();
        for(var i=0;i<checkPoints.length;i++) { 
            capCount = this.doCapture(checkPoints[i], color);
            if(capCount == 1) { 
                potentialKo.push(checkPoints[i]);
            }
            captures += capCount;
        }
        
        // if we captured one single stone with this play, mark it as ko-immune for the next move
        if(potentialKo.length == 1) { 
            this.koImmune = potentialKo[0];
        }

        // check for suicide
        captures -= this.doCapture(pt, -color);
        if (captures < 0) {
            // make sure suicides give proper points (some rulesets allow it)
            color = -color;
            captures = -captures;
        }
        color = color == this.board.WHITE ? "W" : "B";
        this.board.captures[color] += captures;
    },
    doCapture: function(pt, color) {
        this.pendingCaptures = [];
        if (this.findCaptures(pt, color))
            return 0;
        var caps = this.pendingCaptures.length;
        while (this.pendingCaptures.length) {
            this.board.addStone(this.pendingCaptures.pop(), this.board.EMPTY);
        }
        return caps;
    },
    findCaptures: function(pt, color) {
        // out of bounds?
        if (pt.x < 0 || pt.y < 0 ||
            pt.x >= this.board.boardSize || pt.y >= this.board.boardSize)
            return 0;
        // found opposite color
        if (this.board.getStone(pt) == color)
            return 0;
        // found a liberty
        if (this.board.getStone(pt) == this.board.EMPTY)
            return 1;
        // already visited?
        for (var i = 0; i < this.pendingCaptures.length; i++)
            if (this.pendingCaptures[i].x == pt.x && this.pendingCaptures[i].y == pt.y)
                return 0;
        
        this.pendingCaptures.push(pt);
        
        if (this.findCaptures({x: pt.x-1, y: pt.y}, color))
            return 1;
        if (this.findCaptures({x: pt.x+1, y: pt.y}, color))
            return 1;
        if (this.findCaptures({x: pt.x, y: pt.y-1}, color))
            return 1;
        if (this.findCaptures({x: pt.x, y: pt.y+1}, color))
            return 1;
        return 0;
    }
}