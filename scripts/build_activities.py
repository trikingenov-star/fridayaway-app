# -*- coding: utf-8 -*-
"""Activity database for the map search.
  python3 scripts/build_activities.py seed   -> (re)creates data/luoghi-attivita.xlsx from scripts/activities_seed.py
  python3 scripts/build_activities.py        -> reads the xlsx and writes data/activities.json (only rows with Stato = Verificato)
  python3 scripts/build_activities.py all    -> same, but also writes data/activities-draft.json with every row (to preview draft rows in the app with ?db=all)"""
import sys, json, os
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation
H=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(H); XL=os.path.join(ROOT,"data","luoghi-attivita.xlsx")
def seed():
    sys.path.insert(0,H); import activities_seed as S
    dests={d["code"]:d for d in json.load(open(os.path.join(ROOT,"data","dests.json"),encoding="utf-8"))}
    acts={a[0]:a for a in S.ACTS}
    wb=Workbook(); ws=wb.active; ws.title="Luoghi"
    hd=["Codice","Meta","Paese","Attività (chiave)","Attività","Livello (1-3)","Periodo migliore","Nota","Stato verifica","Fonte"]; ws.append(hd)
    for c in ws[1]: c.font=Font(bold=True,color="FFFFFF"); c.fill=PatternFill("solid",fgColor="6C5CE7"); c.alignment=Alignment(vertical="center")
    for code,act,l,per,note,st,src in sorted(S.R,key=lambda r:(r[1],-r[2],r[0])):
        d=dests[code]; ws.append([code,d["city"],d["country"],act,acts[act][1],l,per,note,st,src])
    for col,w in zip("ABCDEFGHIJ",[8,20,16,16,22,12,16,60,16,70]): ws.column_dimensions[col].width=w
    ws.freeze_panes="A2"; ws.auto_filter.ref=ws.dimensions
    n=ws.max_row+300
    dv=DataValidation(type="list",formula1='"Verificato,Da verificare,Escluso"',allow_blank=True); ws.add_data_validation(dv); dv.add(f"I2:I{n}")
    dl=DataValidation(type="whole",operator="between",formula1="1",formula2="3",allow_blank=True); ws.add_data_validation(dl); dl.add(f"F2:F{n}")
    dk=DataValidation(type="list",formula1="=Attività!$A$2:$A$30",allow_blank=True); ws.add_data_validation(dk); dk.add(f"D2:D{n}")
    for r in range(2,ws.max_row+1):
        ws.cell(r,9).fill=PatternFill("solid",fgColor="D1FAE5" if ws.cell(r,9).value=="Verificato" else "FEF3C7")
    wa=wb.create_sheet("Attività"); wa.append(["Chiave","Italiano","English","Español","Emoji","Parole chiave (separate da virgola)"])
    for c in wa[1]: c.font=Font(bold=True,color="FFFFFF"); c.fill=PatternFill("solid",fgColor="6C5CE7")
    for a in S.ACTS: wa.append(list(a))
    for col,w in zip("ABCDEF",[10,22,22,24,8,80]): wa.column_dimensions[col].width=w
    wm=wb.create_sheet("Come si usa")
    for line in ["Una riga = una meta + una attività.","Livello: 3 = meta di riferimento, 2 = c'è ed è buona, 1 = possibile ma non è il punto forte.","Stato verifica: nell'app compaiono SOLO le righe 'Verificato'. 'Da verificare' = scritta dalla conoscenza di Claude, da controllare. 'Escluso' = non usare.","Fonte: link alla pagina che conferma la riga.","Per aggiungere un'attività nuova: aggiungila nel foglio 'Attività' (chiave, nomi, parole chiave) e poi scrivi le righe nel foglio 'Luoghi'.","Dopo le modifiche, rimanda il file: lo ricarico nell'app con scripts/build_activities.py."]: wm.append([line])
    wm.column_dimensions["A"].width=140
    wb.save(XL); print("rows",ws.max_row-1)
def build(all_=False):
    wb=load_workbook(XL,data_only=True); ws=wb["Luoghi"]; wa=wb["Attività"]
    acts=[{"k":r[0],"it":r[1],"en":r[2],"es":r[3],"e":r[4],"kw":[x.strip().lower() for x in str(r[5] or "").split(",") if x.strip()]} for r in wa.iter_rows(min_row=2,values_only=True) if r[0]]
    rows=[]
    for r in ws.iter_rows(min_row=2,values_only=True):
        if not r[0] or not r[3]: continue
        rows.append({"c":r[0],"a":r[3],"l":int(r[5] or 1),"p":r[6] or "","n":r[7] or "","s":r[8] or "","u":r[9] or ""})
    ok=[x for x in rows if x["s"]=="Verificato"]
    json.dump({"acts":acts,"rows":ok},open(os.path.join(ROOT,"data","activities.json"),"w",encoding="utf-8"),ensure_ascii=False,separators=(",",":"))
    print("verified",len(ok),"of",len(rows))
    if all_:
        json.dump({"acts":acts,"rows":[x for x in rows if x["s"]!="Escluso"]},open(os.path.join(ROOT,"data","activities-draft.json"),"w",encoding="utf-8"),ensure_ascii=False,separators=(",",":"))
if __name__=="__main__":
    m=sys.argv[1] if len(sys.argv)>1 else ""
    if m=="seed": seed()
    else: build(m=="all")
