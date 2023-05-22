. /opt/app/virtual/starken_mimansa_apps/bin/activate
export TERM=vt100
export LANG=es_ES.UTF-8
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/lib/oracle/12.2/client64/lib/
umask 011
if test -f "/opt/app/starken_mimansa_apps/starken_mimansa_apps/rf/rf_mimansa_apps.py"; then
    python -W ignore /opt/app/starken_mimansa_apps/starken_mimansa_apps/rf/rf_mimansa_apps.py
else
    python -W ignore /opt/app/starken_mimansa_apps/rf/rf_mimansa_apps.py
fi
umask 022
deactivate