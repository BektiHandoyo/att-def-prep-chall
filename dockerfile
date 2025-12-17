FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# ===== Base packages =====
RUN apt update && apt install -y \
    python3 python3-pip \
    nodejs npm \
    sudo curl \
    gcc make \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ===== Users =====
RUN useradd -m -s /bin/bash blacktea \
 && useradd -m -s /bin/bash svcuser

# ===== Copy services =====
# blacktea services
COPY encryptor /home/blacktea/encryptor
COPY healthcheck /home/blacktea/healthcheck
COPY midnight /home/blacktea/midnight

# svcuser services
COPY report-generator /home/svcuser/report-generator
COPY shellrunner /home/svcuser/shellrunner

# malware check (root owned)
COPY malware-check /opt/malware-check

# ===== Ownership =====
RUN chown -R blacktea:blacktea /home/blacktea \
 && chown -R svcuser:svcuser /home/svcuser \
 && chown -R root:root /opt/malware-check

# ===== Permissions =====
RUN chmod 750 /opt/malware-check \
 && chmod 750 /opt/malware-check/malwarescan.py \
 && chmod +x /home/**/**/start.sh

# ===== SUID curl =====
RUN chown root:root /usr/bin/curl \
 && chmod 4755 /usr/bin/curl

# ===== Sudo escalation (svcuser only) =====
RUN echo "svcuser ALL=(root) NOPASSWD: /usr/bin/python3 /opt/malware-check/malwarescan.py *" \
    > /etc/sudoers.d/malware \
 && chmod 440 /etc/sudoers.d/malware

# ===== Flags =====
COPY flag /flag

RUN cp /flag/user.txt /home/blacktea/flag.txt \
 && cp /flag/user.txt /home/svcuser/flag.txt \
 && cp /flag/root.txt /root/flag.txt \
 && chown blacktea:blacktea /home/blacktea/flag.txt \
 && chown svcuser:svcuser /home/svcuser/flag.txt \
 && chown root:root /root/flag.txt \
 && chmod 400 /home/blacktea/flag.txt \
 && chmod 400 /home/svcuser/flag.txt \
 && chmod 400 /root/flag.txt

# ===== Exposed ports =====
EXPOSE 5001 5000 8000 8080 31337

# ===== Entrypoint =====
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
