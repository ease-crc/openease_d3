FROM ubuntu
ADD . /opt/webapp/webrob/static/lib/chart
VOLUME /opt/webapp/webrob/static/lib/chart
CMD /bin/sh
