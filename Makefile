.PRECIOUS: gnome-backgrounds
gnome-backgrounds:
	git clone git@ssh.gitlab.gnome.org:GNOME/gnome-backgrounds.git

.SECONDARY: gnome-backgrounds.rev
gnome-backgrounds.rev: gnome-backgrounds
	git -C gnome-backgrounds rev-parse main | tr -d '\n' > newrev.rev
	if [ "`cat newrev.rev`" != "`cat gnome-backgrounds.rev`" ]; then \
		echo "New revision of gnome-backgrounds"; \
		cp newrev.rev gnome-backgrounds.rev; \
	fi ; \
	rm newrev.rev

.SECONDARY: results
results: gnome-backgrounds.rev
	bash collect-backgrounds.sh

.PRECIOUS: data
data: results
	mkdir -p data
	mkdir -p data/images
	find results/images -mindepth 1 | grep -v source | xargs -I {} cp {} data/images
	cp results/*.json data