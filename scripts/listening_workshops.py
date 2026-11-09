"""Ateliers de lecture et d'écoute et réglages audio partagés."""
from html import escape
from music_theory import KEYS,french,pretty

def preferences(prefix,expanded=False):
    return f'''<details class="audio-preferences" {'open' if expanded else ''}><summary>Son et volumes</summary><div class="controls" data-audio-settings><label for="{prefix}-sound">Son des notes <select id="{prefix}-sound" data-sound-setting="timbre"><option value="piano">Piano doux</option><option value="sustain">Son tenu</option></select></label><label for="{prefix}-note-volume">Notes <input id="{prefix}-note-volume" data-sound-setting="noteVolume" type="range" min="0" max="100" value="70" aria-label="Volume des notes"><output>70 %</output></label><label for="{prefix}-click-style">Pulsations <select id="{prefix}-click-style" data-sound-setting="clickStyle"><option value="wood">Bois clair</option><option value="felt">Clic feutré</option></select></label><label for="{prefix}-click-volume">Volume du clic <input id="{prefix}-click-volume" data-sound-setting="clickVolume" type="range" min="0" max="100" value="75" aria-label="Volume des pulsations"><output>75 %</output></label><button type="button" class="btn" data-sound-preview>Tester le clic</button></div></details>'''

def playback_controls(prefix,contour=False):
    contour_select=f'<label for="{prefix}-contour">Sens <select id="{prefix}-contour"><option value="both">Montée et descente</option><option value="up">Montée</option><option value="down">Descente</option></select></label>' if contour else ''
    return f'''<div class="controls playback-controls"><label for="{prefix}-tempo">Tempo ♩ = <output id="{prefix}-tempo-value">80</output><input id="{prefix}-tempo" type="range" min="40" max="160" step="2" value="80" aria-label="Tempo à la noire"></label>{contour_select}<label><input type="checkbox" id="{prefix}-click"> Clic</label><label><input type="checkbox" id="{prefix}-loop"> Boucle</label></div>'''+preferences(prefix)

def score_area(prefix):
    return f'<div class="diagram-scroll pitch-score" id="{prefix}-score"></div><p class="listening-now" id="{prefix}-now" aria-live="off">Les notes écrites se surlignent pendant la lecture.</p>'

def workshop(prefix,title,description,choices,button='Écouter',contour=False):
    selects=''
    for key,label,options,default in choices:
        selects+=f'<label for="{prefix}-{key}">{label} <select id="{prefix}-{key}">'+''.join(f'<option value="{escape(str(value),quote=True)}"'+(' selected' if value==default else '')+f'>{escape(text)}</option>' for value,text in options)+'</select></label>'
    return f'''<div class="tool listening-workshop" data-workshop="{prefix}"><p class="eyebrow">Atelier de lecture et d’écoute · ténor Si♭</p><h3>{title}</h3><p>{description}</p><div class="controls">{selects}</div>{playback_controls(prefix,contour)}<div class="notes" id="{prefix}-notes"></div>{score_area(prefix)}<div class="actions"><button class="btn primary" id="{prefix}-play">{button}</button><button class="btn" id="{prefix}-stop">Arrêter</button></div><p class="player-status" id="{prefix}-status" aria-live="polite">Notes écrites pour ténor ; le son est transposé une neuvième majeure plus bas.</p></div>'''

def new_workshops():
    roots=[(k,french(k)+' ('+pretty(k)+')') for k in KEYS]
    return {
    'interval':workshop('interval','Entendre un intervalle','Lisez les deux notes, écoutez leur écart, puis chantez la seconde avant de la rejouer.',[('key','Note de départ écrite',roots,'Eb'),('kind','Intervalle',[('minor3','Tierce mineure'),('major3','Tierce majeure'),('fifth','Quinte juste'),('octave','Octave')],'major3'),('reading','Lecture',[('successive','Deux notes successives'),('together','Successives puis ensemble')],'successive')]),
    'chord':workshop('chord','Du symbole à l’arpège','Comparez les familles d’accords. Un accord plaqué permet d’entendre sa couleur ; l’arpège montre les notes à jouer successivement au saxophone.',[('key','Fondamentale écrite',roots,'F'),('quality','Accord',[('m7','Mineur 7'),('maj7','Majeur 7'),('7','Dominante 7'),('m7b5','Demi-diminué'),('dim7','Diminué 7'),('mMaj7','Mineur majeur 7'),('m6','Mineur 6')],'m7'),('reading','Lecture',[('arpeggio','Arpège'),('compare','Accord puis arpège'),('down','Arpège descendant')],'arpeggio')]),
    'guide':workshop('guide','Suivre les tierces et septièmes','Écoutez une ligne seule, puis les deux voix. Chantez les points d’arrivée avant de les jouer au ténor.',[('key','Tonique écrite',roots,'Eb'),('mode','Cadence',[('major','Majeure'),('minor','Mineure')],'major'),('line','Ligne',[('seventh','Septième → tierce → septième'),('third','Tierce → septième → tierce'),('both','Les deux lignes ensemble')],'third')]),
    'form':workshop('form','Entendre le rôle de chaque section','Parcourez l’étude AABA originale en écoutant ses fondamentales, ses accords ou une ligne guide. Repérez les fins différentes des A.',[('section','Passage',[('A1','A₁ · mesures 1–8'),('A2','A₂ · mesures 9–16'),('B','B · mesures 17–24'),('A3','A₃ · mesures 25–32'),('all','La forme entière')],'A1'),('reading','Lecture',[('roots','Fondamentales'),('chords','Accords'),('guides','Notes guides')],'roots')]),
    'cycle':workshop('cycle','Entendre les cadences du cercle','Choisissez la tonique écrite sur le cercle, puis comparez la cadence majeure et la cadence mineure de même tonique.',[('mode','Cadence',[('major','Majeure'),('minor','Mineure')],'major'),('reading','Lecture',[('arpeggio','Arpèges'),('chords','Accords'),('guides','Notes guides')],'arpeggio')]),
    'body':workshop('body','Lire et entendre le A de Body and Soul','Le lecteur suit la réduction pédagogique de huit mesures du chapitre. Écoutez les arrivées en Mi♭ majeur puis Do mineur, en notation ténor.',[('reading','Lecture',[('roots','Fondamentales'),('arpeggio','Arpèges'),('chords','Accords'),('guides','Notes guides')],'roots')]),
    }
